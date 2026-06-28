import express from "express";
import crypto from "crypto";
import { project_env } from "../lib/env.js";
import { Project } from "../models/project.model.js";
import { buildQueue } from "../utils/queues.js";
import { QUEUE_NAMES } from "../../../../shared/queues/queueNames.js";
import { deleteCacheBuildData } from "../utils/cache/deleteCacheBuildData.js";
import { clearCacheProjectData } from "../../../../shared/utils/cacheProjectData.js";
import { publishProjectStatus } from "../../../../shared/utils/publishProjectStatus.js";
import { getRedis } from "../core/redis/client.js";

const router = express.Router();

router.post(
    "/",
    express.raw({ type: "*/*" }),
    async (req, res) => {
        try {

            const redis = getRedis();
            
            const signature = req.headers["x-hub-signature-256"];
            const secret = project_env.GITHUB_WEBHOOK_SECRET;

            if (!signature || !secret) {
                return res.status(401).send("Missing signature");
            }

            const hmac = crypto.createHmac("sha256", secret);
            const digest = "sha256=" + hmac.update(req.body).digest("hex");

            const sigBuffer = Buffer.from(signature);
            const digestBuffer = Buffer.from(digest);

            if (
                sigBuffer.length !== digestBuffer.length ||
                !crypto.timingSafeEqual(sigBuffer, digestBuffer)
            ) {
                return res.status(401).send("Invalid signature");
            }

            if (req.headers["x-github-event"] !== "push") {
                return res.status(200).send("Ignored (not push event)");
            }

            const payload = JSON.parse(req.body.toString());

            const pushedBranch = payload.ref.replace("refs/heads/", "");

            const repoUrl = payload.repository.clone_url.replace(/\.git$/, "");

            // Get all changed files
            const changedFiles = payload.commits.flatMap(commit => [
                ...(commit.added || []),
                ...(commit.modified || []),
                ...(commit.removed || [])
            ]);

            console.log("Changed Files:", changedFiles);

            const projects = await Project.find({
                repoUrl,
                status: { $ne: "deleted" }
            });

            if (!projects.length) {
                return res.status(200).send("No matching projects");
            }

            let triggered = 0;

            for (const project of projects) {

                // Branch mismatch
                if (project.branch !== pushedBranch) {
                    console.log(`Skipping ${project.name}: branch mismatch`);
                    continue;
                }

                const rootDir = (project.rootDirectory || ".")
                    .replace(/^\.\/?$/, "")
                    .replace(/^\/|\/$/g, "");

                const shouldDeploy =
                    rootDir === ""
                        ? true
                        : changedFiles.some(file =>
                            file === rootDir || file.startsWith(rootDir + "/")
                        );

                if (!shouldDeploy) {
                    console.log(
                        `Skipping ${project.name}: no files changed in ${project.rootDirectory}`
                    );
                    continue;
                }

                project.status = "queued";
                await project.save({ validateBeforeSave: false });

                await buildQueue.add(QUEUE_NAMES.BUILD, {
                    projectId: project._id,
                    userId: project.userId,
                    plan: project.plan,
                    firstTime: false
                });

                await deleteCacheBuildData(project._id);
                await clearCacheProjectData(project._id, redis)
                await publishProjectStatus(redis, { projectId: project._id, status: 'queued' })

                triggered++;

                console.log(`Auto deploy triggered -> ${project.name}`);
            }

            return res.status(200).json({
                success: true,
                triggered,
                changedFiles
            });

        } catch (err) {
            console.error("Webhook Error:", err);
            return res.status(500).send("Webhook failed");
        }
    }
);

export default router;