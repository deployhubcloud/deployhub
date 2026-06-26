import { body, param } from "express-validator";

export const projectSettingValidators = [
    param('projectId')
        .isMongoId()
        .withMessage('invalid ProjectId'),
]

export const updateEnvSettingsValidators = [
    param('projectId')
        .isMongoId()
        .withMessage('invalid ProjectId'),
]

export const updateBuildandStartSettingsValidators = [
    param('projectId')
        .isMongoId()
        .withMessage('invalid ProjectId'),
    body().custom((_, { req }) => {
        if (typeof req.body.buildCommand !== 'string') {
            throw new Error('Build command must be a string');
        }
        if (/(dev|serve|start|preview)/i.test(req.body.buildCommand)) {
            throw new Error("Invalid build command. Use a terminating build script");
        }
        if (typeof req.body.publishDir !== 'string') {
            throw new Error('Publish directory must be a string');
        }
        if (typeof req.body.startCommand !== 'string') {
            throw new Error(`Start command must be a string`);
        }
        const port = Number(req.body.port);
        if (!Number.isInteger(port) || port < 1 || port > 65535) {
            throw new Error('Port must be a valid integer between 1 and 65535');
        }
        if (typeof req.body.rootDirectory !== 'string') {
            throw new Error('Root directory must be a string');
        }

        return true;
    })

]

export const updateHealthMonitoringAndNotificationValidator = [
    param('projectId')
        .isMongoId()
        .withMessage('invalid ProjectId')
]