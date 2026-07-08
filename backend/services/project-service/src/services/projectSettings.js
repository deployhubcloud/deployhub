import { AppError } from "../../../../shared/errors/AppError.js";
import { getRedis } from "../core/redis/client.js";
import { Project } from "../models/project.model.js"
import { deleteProjectQueue, startStopHealthCheck } from "../utils/queues.js";

export const projectSettings = async (projectId) => {

    const projectSettings = await Project.findById(projectId).select("name plan type version repoUrl branch rootDirectory buildCommand publishDir startCommand port subdomain env monitor notifications").lean();
    if (!projectSettings) {
        throw new AppError('Invalid Proejct or Prject not Found', 404)
    }

    let env = {};
    if (Array.isArray(projectSettings.env)) {
        env = Object.fromEntries(
            projectSettings.env.map(item => [
                item.key,
                item.encryptedValue
            ])
        );
    }

    let Settings = {
        projectPlan: projectSettings.plan,
        projectName: projectSettings.name,
        projectType: projectSettings.type,
        projectVersion: projectSettings.version,
        repoUrl: projectSettings.repoUrl,
        branch: projectSettings.branch,
        rootDirectory: projectSettings.rootDirectory,
        monitor: projectSettings.monitor,
        notifications: projectSettings.notifications,
        env
    }
    if (projectSettings.type === 'static') {
        Settings = {
            ...Settings,
            publishDir: projectSettings.publishDir,
            buildCommand: projectSettings.buildCommand
        }
    } else {
        Settings = {
            ...Settings,
            startCommand: projectSettings.startCommand,
            port: projectSettings.port
        }
    }

    return Settings
}


export const updateEnvSettingsServices = async (userId, projectId, body) => {

    const { env } = body

    if (typeof env !== 'object' || Array.isArray(env)) {
        throw new AppError("env must be a key-value object", 400)
    }


    for (const [key, value] of Object.entries(env)) {
        if (!key.trim()) {
            throw new AppError("Empty env key not allowed", 400);
        }

        if (!String(value).trim()) {
            throw new AppError(`Value for '${key}' cannot be empty`, 400);
        }
    }


    const existing = await Project.findOne(
        { _id: projectId, userId }
    ).select('env')

    if (!existing) throw new AppError("Project not found", 404);

    const envMap = new Map()

    for (const [key, value] of Object.entries(env)) {
        envMap.set(key.trim(), value)
    }

    const envArray = Array.from(envMap.entries()).map(([key, encryptedValue]) => ({ key, encryptedValue }))


    const project = await Project.findOneAndUpdate(
        { _id: projectId, userId: userId },
        { $set: { env: envArray } },
        { returnDocument: 'after' }
    ).select('env');

    return project;
}


export const updateBuildandStartSettings = async (userId, projectId, body) => {

    const { buildCommand, publishDir, startCommand, port, rootDirectory } = body

    console.log(projectId, userId)

    const project = await Project.findOne({ _id: projectId, userId }).select('type').lean();
    if (!project) throw new AppError("Invalid Project", 404)

    let update = {}


    if (project.type === 'static') {
        if (buildCommand !== undefined) {
            update.buildCommand = buildCommand;
        }
        if (publishDir !== undefined) {
            update.publishDir = publishDir
        }
        if (rootDirectory !== undefined) {
            update.rootDirectory = rootDirectory
        }

        const project = await Project.findOneAndUpdate(
            {
                _id: projectId, userId: userId
            },
            {
                $set: update
            }
        );
    } else {
        if (startCommand !== undefined) {
            update.startCommand = startCommand
        }
        if (port !== undefined) {
            update.port = port
        }
        if (rootDirectory !== undefined) {
            update.rootDirectory = rootDirectory
        }

        console.log(update)

        await Project.findOneAndUpdate(
            {
                _id: projectId, userId: userId
            },
            {
                $set: update
            },
            {
                returnDocument: 'after'
            }
        );
    }

}

export const updateHealthMonitoringAndNotification = async (userId, projectId, body) => {

    const redis = getRedis();

    const { notifications, monitor, projectPlan } = body;

    const project = await Project.findOne({
        _id: projectId,
        owner: userId,
        status: { $ne: 'deleted' }
    });

    if (!project) throw new AppError("Project not found", 404);

    if (monitor.enabled && projectPlan !== 'pro') {
        throw new AppError("Pro plan required to enable monitoring", 403);
    }

    if (notifications?.email?.enabled && !notifications.email.emailAddress) {
        throw new AppError("Email address required", 400);
    }

    if (notifications?.discord?.enabled && !notifications.discord.webhookUrl) {
        throw new AppError("Discord webhook URL required", 400);
    }

    if (notifications?.telegram?.enabled) {
        if (!notifications.telegram.botToken || !notifications.telegram.chatId) {
            throw new AppError("Telegram bot token and chat ID required", 400);
        }
    }

    const update = {};

    if (monitor.intervalSeconds < 30 || monitor.intervalSeconds > 60) {
        throw new AppError("Interval must be between 30 and 60 seconds");
    }

    if (monitor.failedTries < 1 || monitor.failedTries > 5) {
        throw new AppError("Failed tries must be between 1 and 5");
    }

    if (monitor) {
        if (typeof monitor.enabled === 'boolean') update['monitor.enabled'] = monitor.enabled;
        if (monitor.intervalSeconds) update['monitor.intervalSeconds'] = monitor.intervalSeconds;
        if (monitor.healthPath) update['monitor.healthPath'] = monitor.healthPath;
        if (monitor.failedTries) update['monitor.failedTries'] = monitor.failedTries;

        if (monitor.enabled !== undefined && projectPlan === 'pro') {
            await startStopHealthCheck.add('start-stop-health-check', {
                projectId: projectId,
                enabled: monitor.enabled,
                intervalSeconds: monitor.intervalSeconds
            })
        }
    }

    if (notifications?.email) {
        update['notifications.email.enabled'] = notifications.email.enabled ?? false;
        if (notifications.email.emailAddress) {
            update['notifications.email.emailAddress'] = notifications.email.emailAddress;
        }
    }

    if (notifications?.discord) {
        update['notifications.discord.enabled'] = notifications.discord.enabled ?? false;
        if (notifications.discord.webhookUrl) {
            update['notifications.discord.webhookUrl'] = notifications.discord.webhookUrl;
        }
    }

    if (notifications?.telegram) {
        update['notifications.telegram.enabled'] = notifications.telegram.enabled ?? false;
        if (notifications.telegram.botToken) {
            update['notifications.telegram.botToken'] = notifications.telegram.botToken;
        }
        if (notifications.telegram.chatId) {
            update['notifications.telegram.chatId'] = notifications.telegram.chatId;
        }
    }

    const updated = await Project.findOneAndUpdate(
        { _id: projectId, userId },
        { $set: update },
        { returnDocument: 'after' }
    ).select('monitor notifications');

    await redis.del(`deployhub:project:${projectId}:notifications-settings`)

    return updated;
};


export const deleteProject = async (userId, projectId) => {

    const project = await Project.findById(projectId);
    if (!project || project.userId.toString() !== userId.toString()) {
        throw new AppError("Project not found or you don't have permission to delete this project", 404);
    }

    project.status = 'deleted';
    await project.save();

    await deleteProjectQueue.add('delete-project', { projectId });

    return { message: "Project deleted successfully" };

}