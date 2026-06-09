import { body, param } from 'express-validator'

export const validateChangeSubDomain = [
    param('projectId')
        .isMongoId()
        .withMessage('invalid ProjectId'),
    body('oldSubdomain')
        .notEmpty()
        .withMessage("oldSubDomain is Required")
        .isString()
        .withMessage("oldSubdomain must be String"),
    body('newSubdoamin')
        .notEmpty()
        .withMessage("newSubdomain is Required")
        .isString()
        .withMessage("newSubdoamin must be String")
        .matches(/^[a-z0-9-]{3,40}$/)
        .withMessage("Must be 3-40 characters and contain only lowercase letters, numbers, and hyphens")
]