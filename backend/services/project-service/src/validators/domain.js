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
    body('newSubdomain')
        .notEmpty()
        .withMessage("newSubdomain is Required")
        .isString()
        .withMessage("newSubdomain must be String")
        .matches(/^[a-z0-9-]{3,40}$/)
        .withMessage("Must be 3-40 characters and contain only lowercase letters, numbers, and hyphens")
]

export const getDomainSettingsValidators = [
    param("projectId")
        .isMongoId()
        .withMessage('invalid ProjectId'),
]

export const addCustomDomainValidator = [
    body("domain")
        .trim()
        .notEmpty()
        .withMessage("Domain is required")
        .isLength({ max: 253 })
        .withMessage("Invalid domain length")
        .matches(
            /^(?!:\/\/)(?!.*:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
        )
        .withMessage("Invalid domain format"),

    param("projectId")
        .isMongoId()
        .withMessage("Invalid project id"),
];

export const deleteCustomDomainValidator = [
    body("domain")
        .trim()
        .notEmpty()
        .withMessage("Domain is required")
        .isLength({ max: 253 })
        .withMessage("Invalid domain length")
        .matches(
            /^(?!:\/\/)(?!.*:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
        )
        .withMessage("Invalid domain format"),

    param("projectId")
        .isMongoId()
        .withMessage("Invalid project id"),
];

export const renewCustomDomainValidator = [
    body("domain")
        .trim()
        .notEmpty()
        .withMessage("Domain is required")
        .isLength({ max: 253 })
        .withMessage("Invalid domain length")
        .matches(
            /^(?!:\/\/)(?!.*:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
        )
        .withMessage("Invalid domain format"),

    param("projectId")
        .isMongoId()
        .withMessage("Invalid project id"),
];
