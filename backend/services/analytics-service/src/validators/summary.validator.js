import { param } from 'express-validator'

export const summaryValidators = [
    param('projectId')
        .isMongoId()
        .withMessage('Invalid Project Id')
]