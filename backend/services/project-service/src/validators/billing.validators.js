import { param } from "express-validator";

export const getProjectBillingValidators = [
    param("projectId")
        .isMongoId()
        .withMessage('invalid ProjectId'),
]