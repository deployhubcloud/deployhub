import { param } from 'express-validator';

export const projectIdParam = [
    param('projectId').isMongoId().withMessage('Invalid projectId'),
];

export const buildIdParam = [
    param('buildId').isMongoId().withMessage('Invalid buildId'),
];
