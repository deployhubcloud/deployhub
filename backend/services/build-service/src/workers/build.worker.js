import { Worker } from 'bullmq';
import { QUEUE_NAMES } from '../../../../shared/queues/queueNames.js';
import { connection } from '../utils/queues/queues.js';
import { GitCloner } from '../../../../shared/git/gitrepoCloner.js';
import { getProjectDataById } from '../../../../shared/utils/getProjectDataById.js';
import axios from 'axios';
import { buildEnv } from '../lib/env.js';
import Docker from 'dockerode'
import RedisPubSub from '../../../../shared/redis/pubSubRedis.js';
import { Build } from '../models/build.model.js';
import { getUserGithubAccessToken } from '../../../../shared/utils/getUserGIthubAccesstoken.js';
import { fetchCommitSha } from '../../../../shared/utils/fetchCommitSha.js';
import Redis from 'ioredis';
import { deployQueue } from '../utils/queues/queues.js';
import fs from 'fs';
import path from 'path';
import { generateDockerfile } from '../../../../shared/docker/generateDockerfile.js';
import tar from "tar-fs";
import { buildDockerImage } from '../../../../shared/docker/buildImage.js';
import { dockerProgress } from '../../../../shared/docker/dockerProgress.js';
import { BuildLogger } from '../utils/buildLogger.js';
import { pushDockerImage } from '../../../../shared/docker/pushImage.js';
import { createZip } from '../utils/createZip.js';
import { uplaodStatisBuildZipFile } from '../utils/minio/minio.js';
import * as maintar from 'tar';
import { typeLangVersionSelector } from '../utils/languageVersion.js';
import { checkAndPullImage } from '../../../../shared/docker/checkAndPullImage.js';
import { deleteCacheBuildData } from '../utils/cacheBuildData.js';
import { publishProjectStatus } from '../../../../shared/utils/publishProjectStatus.js';
import { getRedis } from '../core/redis/client.js';
import { cacheLatestBuildIdOfProject } from '../../../../shared/utils/cacheLatestBuildIdofProject.js';


const docker = new Docker()

const redisPubSub = new RedisPubSub(
    Redis,
    {
        host: buildEnv.REDIS_HOST,
        port: buildEnv.REDIS_PORT,
        password: buildEnv.REDIS_PASSWORD,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true
    }
);

const redis = getRedis();



const queueProjectDeploy = async (projectId, projectplan, userId, buildId, firstTime) => {
    await deployQueue.add('deploy', {
        projectId: projectId,
        plan: projectplan,
        userId: userId,
        buildId: buildId,
        firstTime: firstTime
    });
};


// ye base repo folder path hai
const baserepopath = path.resolve('builds');

// ye docker ka credentials hai
const dockerUsername = buildEnv.DOCKER_USERNAME;
const dockerPassword = buildEnv.DOCKER_PASSWORD;

export const buildWorker = new Worker(QUEUE_NAMES.BUILD, async (job) => {

    // data from the queue
    const { projectId, plan, userId } = job.data;


    await publishProjectStatus(redis, { projectId: projectId, status: 'building' })

    await deleteCacheBuildData(projectId);
    let project;
    let newBuild;
    let imageName;

    // ye buildfilepath ka pura folder path hai
    let buildFilePath;

    let logsUrl;
    let logger;

    let startedAt;
    let finishedAt;

    try {


        // ye startat means abhi ka time jab start hua ahi
        startedAt = new Date()

        // get the project details from service
        project = await getProjectDataById(axios, projectId, buildEnv.PROJECT_SERVICE_URL, buildEnv.INTERNAL_SECRET, buildEnv.INTERNAL_SERVICE_TALKING_SECRET);

        // here also fetch token from serive
        const userGithubAcessToken = await getUserGithubAccessToken(axios, buildEnv.IDENTITY_SERVICE_URL, userId, buildEnv.INTERNAL_SERVICE_TALKING_SECRET, buildEnv.INTERNAL_SECRET)

        // here fetch commitsha
        const commitSha = await fetchCommitSha(project.repoUrl, project.branch, userGithubAcessToken)



        // here create data for proejt i f not exists
        newBuild = await Build.create({
            userId: userId,
            project: project._id,
            projectName: project.name,
            commitSha: commitSha,
            status: "pending",
            startedAt: new Date(),
        })

        const cacheData = {
            buildId: newBuild._id,
            projectContainerName: project.dockerContainerName,
            projectType: project.type
        }

        await cacheLatestBuildIdOfProject(projectId, redis, cacheData);

        logger = new BuildLogger(newBuild._id, projectId)
        await logger.start()

        // here i send pub/sub of project status so every service listen and work
        await redisPubSub.produce('deployhub:users:build:status', JSON.stringify({
            projectId: project._id,
            projectstatus: "building",
            userId: userId,
            projectName: project.name,
            buildId: newBuild._id,
        }));


        // here i make docker image name
        imageName = `${dockerUsername}/${projectId.toString().toLowerCase()}:${newBuild._id.toString().toLowerCase()}`;


        // base repo path
        if (!fs.existsSync(baserepopath)) {
            fs.mkdirSync(baserepopath, { recursive: true });
        }

        // build filepath
        buildFilePath = path.resolve(baserepopath, newBuild._id.toString());

        // check build se bahar na jaye user
        if (!buildFilePath.startsWith(baserepopath)) {
            throw new Error('Invalid build path');
        }

        // yeha pe agar buildFilePath nhi hai to create ho jayega
        if (!fs.existsSync(buildFilePath)) fs.mkdirSync(buildFilePath, { recursive: true });


        let dynamicBuildArgs = {};

        if (project.type === 'static') {
            let viteEnvContent = '';

            for (const envVar of project.env || []) {
                viteEnvContent += `${envVar.key}=${envVar.encryptedValue}\n`;
            }

            dynamicBuildArgs.VITE_ENV_CONTENT = viteEnvContent;
        }

        const lanVersion = typeLangVersionSelector(project.type, project.version)


        logger.write(`cloning repo ${project.repoUrl}`)

        try {
            await GitCloner.clone({ repoUrl: project.repoUrl, branch: project.branch, targetPath: buildFilePath, githubToken: userGithubAcessToken, folderName: project.rootDirectory })

        } catch (error) {
            switch (error.code) {
                case "BRANCH_NOT_FOUND":
                    logger.write(error.message);
                    break;

                case "REPO_NOT_FOUND":
                    logger.write(error.message);
                    break;

                case "AUTH_FAILED":
                    logger.write(error.message);
                    break;

                default:
                    logger.write(`Failed to clone repository`);
            }
            throw error
        }
        logger.write(`repo cloned successfully`)


        logger.write("generating dockerfile");

        // yeha pe docker file likha ja raha hai , based on proejct type
        const dockerfileContent =
            generateDockerfile({
                projectType: project.type,
                version: project.version,
                buildCommand: project?.buildCommand,
                startCommand: project?.startCommand
            });

        logger.write(`dockerfile generated`)


        // and yeha pe jo buildfilepath hai uske dockerfike copy ho raha hai
        await fs.writeFileSync(
            path.join(buildFilePath, "Dockerfile"),
            dockerfileContent
        );

        logger.write(`pulling base image ${lanVersion}`)

        await checkAndPullImage(docker, lanVersion)

        logger.write(`base image ready`)

        const buildContext = tar.pack(buildFilePath);

        logger.write('building docker image')

        const stream = await buildDockerImage({
            docker,
            buildContext,
            imageName,
            dockerFile: "Dockerfile",
            buildArgs: dynamicBuildArgs
        });

        await dockerProgress(
            docker,
            stream,
            logger
        )

        logger.write('image build complete')

        if (project.type === 'static') {

            logger.write('spinning up container');

            const container = await docker.createContainer({
                Image: imageName
            });

            let archiveStream;
            try {
                archiveStream = await container.getArchive({
                    path: `/app/${project.publishDir}`
                })
            } catch (error) {
                logger.write(`invalid PublishDir! ${project.publishDir}, "please check your Settings`);
                throw error;
            }

            const tarFile = path.join(
                buildFilePath,
                'artifact.tar'
            );

            await new Promise((resolve, reject) => {

                const writeStream =
                    fs.createWriteStream(tarFile);

                archiveStream.pipe(writeStream);

                writeStream.on('finish', resolve);
                writeStream.on('error', reject);
            });

            const extractedDir = path.join(
                buildFilePath,
                'publish'
            );

            fs.mkdirSync(
                extractedDir,
                { recursive: true }
            );

            await maintar.extract({
                file: tarFile,
                cwd: extractedDir
            });

            logger.write('creating zip archive')

            const zipPath = path.join(
                buildFilePath,
                'build.zip'
            );

            await createZip(
                path.join(
                    extractedDir,
                    project.publishDir
                ),
                zipPath
            );

            logger.write('zip created')

            const zipBuffer = fs.readFileSync(zipPath);

            logger.write('uploading your zip...')

            await uplaodStatisBuildZipFile(
                `buildzip/${projectId}/${newBuild._id}.zip`,
                zipBuffer
            );

            logger.write('zip uploaded')

            await container.remove({
                force: true
            });

            logger.write('cleaning up container');

            await docker.getImage(imageName).remove({
                force: true
            });

        } else {

            const pushStream = await pushDockerImage({
                docker,
                imageName,
                username: dockerUsername,
                password: dockerPassword
            });

            await dockerProgress(
                docker,
                pushStream,
                logger
            );

            newBuild.dockerImage = imageName
            await newBuild.save({ validateBeforeSave: false })

        }

        const buildlogUrl = await logger.finish("success");

        logsUrl = buildlogUrl

        finishedAt = new Date()

        newBuild.startedAt = startedAt;
        newBuild.finishedAt = finishedAt;
        newBuild.logUrl = logsUrl
        newBuild.status = 'success'

        await newBuild.save({ validateBeforeSave: false })


        await deleteCacheBuildData(projectId);
        return {
            projectId: project._id,
            projectName: project.name,
            buildId: newBuild._id,
            logsUrl,
            userId,
            plan,
            serviceType: project.type,
            imageName
        };

    } catch (error) {

        console.log(error)

        if (logger) {
            const buildlogUrl =
                await logger.finish("failed");

            if (newBuild) {
                newBuild.status = "failed";
                newBuild.logUrl = buildlogUrl;
                newBuild.startedAt = startedAt;
                newBuild.finishedAt = new Date();

                await newBuild.save({
                    validateBeforeSave: false
                });

                const cacheData = {
                    logsUrl: buildlogUrl
                }

                await cacheLatestBuildIdOfProject(projectId, redis, cacheData);
            }

            if (project) {
                await redisPubSub.produce(
                    'deployhub:users:build:status',
                    JSON.stringify({
                        projectId: project._id,
                        projectstatus: "failed",
                        userId,
                        projectName: project.name,
                        buildId: newBuild?._id,
                        logsUrl: buildlogUrl,
                        serviceType: project.type
                    })
                );
            }
        }

        await publishProjectStatus(redis, { projectId: projectId, status: 'failed' })

        await deleteCacheBuildData(projectId);

        throw error;
    } finally {
        if (
            buildFilePath &&
            fs.existsSync(buildFilePath)
        ) {
            fs.rmSync(buildFilePath, {
                recursive: true,
                force: true
            });
        }


    }
}, {
    connection: connection,
    concurrency: 1
})

buildWorker.on("completed", async (job, result) => {

    const { projectId, plan, userId, firstTime } = job.data;

    // here i send pub/sub of project status so every service listen and work
    await redisPubSub.produce('deployhub:users:build:status', JSON.stringify({
        projectId: result.projectId,
        projectstatus: "success",
        userId: result.userId,
        projectName: result.projectName,
        buildId: result.buildId,
        logsUrl: result.logsUrl,
        serviceType: result.serviceType,
        dockerImage: result.imageName
    }));

    await queueProjectDeploy(projectId, plan, userId, result.buildId, firstTime);

    const cacheData = {
        logsUrl: result.logsUrl
    }

    await cacheLatestBuildIdOfProject(projectId, redis, cacheData);
    console.log('job completed for build')
})

buildWorker.on("failed", async (job) => {
    console.log('build failed')
})
