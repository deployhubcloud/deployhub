import { param } from 'express-validator';

export const uptimeValidators = [
    param('projectId').isMongoId().withMessage('Invalid projectId'),
];
