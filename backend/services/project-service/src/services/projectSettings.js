import { AppError } from "../../../../shared/errors/AppError.js";
import { Project } from "../models/project.model.js"

export const projectSettings = async (projectId) => {

    const projectSettings = await Project.findById(projectId).select("name type version repoUrl branch rootDirectory buildCommand publishDir startCommand port subdomain env monitor notifications").lean();
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