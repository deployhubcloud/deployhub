import { param } from "express-validator";

export const projectSettingValidators = [
    param('projectId')
        .isMongoId()
        .withMessage('invalid ProjectId'),
]