import { param, query } from 'express-validator';

export const projectDeploymentsValidators = [
    param('projectId').isMongoId().withMessage('Invalid projectId'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('limit must be 1-50'),
];

export const projectIdParam = [
    param('projectId').isMongoId().withMessage('Invalid projectId'),
];
