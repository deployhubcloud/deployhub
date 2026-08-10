import { body, param } from 'express-validator';

export const projectIdParamValidator = [
    param('projectId').isMongoId().withMessage('Invalid projectId'),
];

export const mergeEnvValidators = [
    param('projectId').isMongoId().withMessage('Invalid projectId'),
    body('patch')
        .exists().withMessage('patch is required')
        .isObject().withMessage('patch must be an object')
        .custom((patch) => {
            if (Array.isArray(patch)) throw new Error('patch must be an object');
            if (Object.keys(patch).length > 50) throw new Error('Too many keys in patch (max 50)');
            return true;
        }),
    body('removeKeys')
        .optional()
        .isArray().withMessage('removeKeys must be an array')
        .custom((arr) => {
            if (arr.length > 50) throw new Error('Too many removeKeys (max 50)');
            return true;
        }),
];
