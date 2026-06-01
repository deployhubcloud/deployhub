import { body } from 'express-validator';
import { plans } from '../../../../shared/constants/plan.js';

export const PROJECT_TYPES = [...new Set(
    Object.values(plans).flatMap((plan) => plan.deployment_Type)
)];

const getProjectName = (body) => body.projectName || body.name;
const getProjectType = (body) => body.projectType || body.type;
const getRepoUrl = (body) => body.repoUrl || body.codeLink;
const getBranch = (body) => body.branch || body.branchname;
const getRootDirectory = (body) => {
    if (body.rootDirectory) return body.rootDirectory;
    if (body.isFolder) return body.folderName;
    return '.';
};

export const createProjectValidator = [
    body('plan')
        .optional()
        .isIn(Object.keys(plans))
        .withMessage(`Plan must be one of: ${Object.keys(plans).join(', ')}`),

    body().custom((_, { req }) => {
        const projectName = getProjectName(req.body);
        if (!projectName || typeof projectName !== 'string') {
            throw new Error('Project name is required');
        }
        if (projectName.length > 100) {
            throw new Error('Project name must be at most 100 characters long');
        }
        if (!/^[a-zA-Z0-9-_ ]+$/.test(projectName)) {
            throw new Error('Project name can only contain letters, numbers, spaces, hyphens, and underscores');
        }
        if (projectName.toLowerCase() === 'default') {
            throw new Error("Project name cannot be 'default'");
        }

        const projectType = getProjectType(req.body);
        if (!PROJECT_TYPES.includes(projectType)) {
            throw new Error(`Project type must be one of: ${PROJECT_TYPES.join(', ')}`);
        }

        const repoUrl = getRepoUrl(req.body);
        if (!repoUrl || typeof repoUrl !== 'string') {
            throw new Error('Repo URL is required');
        }
        try {
            new URL(repoUrl);
        } catch {
            throw new Error('Repo URL must be a valid URL');
        }

        const branch = getBranch(req.body);
        if (!branch || typeof branch !== 'string') {
            throw new Error('Branch is required');
        }

        const rootDirectory = getRootDirectory(req.body);
        if (!rootDirectory || typeof rootDirectory !== 'string') {
            throw new Error('Root directory is required');
        }

        if (projectType === 'static') {
            if (!req.body.buildCommand || typeof req.body.buildCommand !== 'string') {
                throw new Error('Build command is required for static project');
            }
            if (/(dev|serve|start|preview)/i.test(req.body.buildCommand)) {
                throw new Error("Invalid build command. Use a terminating build script like 'npm run build' or 'npm run generate'.");
            }
            if (!req.body.publishDir || typeof req.body.publishDir !== 'string') {
                throw new Error('Publish directory is required for static project');
            }
        } else {
            if (!req.body.startCommand || typeof req.body.startCommand !== 'string') {
                throw new Error(`Start command is required for ${projectType} project`);
            }

            const port = Number(req.body.port);
            if (!Number.isInteger(port) || port < 1 || port > 65535) {
                throw new Error('Port must be a valid integer between 1 and 65535');
            }
        }

        if (req.body.subdomain && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(req.body.subdomain)) {
            throw new Error('Subdomain can only contain lowercase letters, numbers, and hyphens');
        }

        if (req.body.env && (typeof req.body.env !== 'object' || Array.isArray(req.body.env))) {
            throw new Error('Env must be an object');
        }

        const notifications = req.body.notifications || {};
        if (notifications.discord?.enabled && !notifications.discord.webhookUrl) {
            throw new Error('Discord webhook URL required');
        }
        if (notifications.telegram?.enabled && (!notifications.telegram.botToken || !notifications.telegram.chatId)) {
            throw new Error('Telegram bot token and chat ID required');
        }
        if (notifications.email?.enabled && !notifications.email.emailAddress) {
            throw new Error('Email address required');
        }

        return true;
    }),
];

export const paymentInitValidator = [
    ...createProjectValidator,
    body('months')
        .optional()
        .isInt({ min: 1, max: 24 })
        .withMessage('Months must be between 1 and 24'),
];
