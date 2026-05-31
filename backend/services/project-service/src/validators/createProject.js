import { body } from 'express-validator';

export const createProjectValidator = [
    body("projectName")
        .notEmpty()
        .withMessage("Project name is required")
        .isString()
        .withMessage("Project name must be a string")
        .isLength({ max: 100 })
        .withMessage("Project name must be at most 100 characters long")
        .matches(/^[a-zA-Z0-9-_ ]+$/)
        .withMessage("Project name can only contain letters, numbers, spaces, hyphens, and underscores")
        .custom((value, { req }) => {
            if (value.toLowerCase() === 'default') {
                throw new Error("Project name cannot be 'default'");
            }
            return true;
        })
        .trim()
        .normalizeSpace(),
    body("projectType")
        .notEmpty()
        .withMessage("Project type is required")
        .isIn(["static", "node"])
        .withMessage("Project type must be static or node"),
    body("isMicroservice")
        .notEmpty()
        .withMessage("isMicroservice is required")
        .isBoolean()
        .withMessage("isMicroservice must be a boolean"),
    body("repoUrl")
        .notEmpty()
        .withMessage("Repo URL is required")
        .isURL()
        .withMessage("Repo URL must be a valid URL"),
    body("branch")
        .notEmpty()
        .withMessage("Branch is required")
        .isString()
        .withMessage("Branch must be a string"),
    body("rootDirectory")
        .notEmpty()
        .withMessage("Root directory is required")
        .isString()
        .withMessage("Root directory must be a string"),
    body("buildCommand")
        .if(body("projectType").equals("static"))
        .notEmpty()
        .withMessage("Build command is required for static project")
        .custom((value) => {
            const invalid = /(dev|serve|start|preview)/i;
            if (invalid.test(value)) {
                throw new Error("Invalid build command. Use a terminating build script like 'npm run build' or 'npm run generate'.");
            }
            return true;
        }),
    body("publishDir")
        .if(body("projectType").equals("static"))
        .notEmpty()
        .withMessage("Publish directory is required for static project")
        .isString()
        .withMessage("Publish directory must be a string"),
    body("startCommand")
        .if(body("projectType").equals("node"))
        .notEmpty()
        .withMessage("Start command is required for node project")
        .isString()
        .withMessage("Start command must be a string"),
    body('port')
        .if(body("projectType").equals('node'))
        .notEmpty()
        .withMessage('Port is required for node project')
        .isInt({ min: 1, max: 65535 })
        .withMessage('Port must be a valid integer between 1 and 65535'),
    body('subdomain')
        .if(body('isMicroservice').equals(false))
        .optional()
        .isString()
        .withMessage('Subdomain must be a string')
        .matches(/^[a-z0-9]+(-[a-z0-9]+)*$/)
        .withMessage('Subdomain can only contain lowercase letters, numbers, and hyphens'),
    body('env')
        .optional()
        .isObject()
        .withMessage('Env must be an object')
];