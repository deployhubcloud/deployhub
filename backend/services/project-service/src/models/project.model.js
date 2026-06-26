import mongoose from "mongoose";


const projectschema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ["static", "node", "go", "python", "java"],
    },
    status: {
        type: String,
        enum: ['draft', 'queued', 'building', 'running', 'failed', 'stopped', 'crash'],
        default: 'queued'
    },
    version: {
        type: Number
    },
    isMicroservice: {
        type: Boolean,
        default: false
    },
    repoUrl: {
        type: String,
        required: true
    },
    branch: {
        type: String,
        default: 'main'
    },
    rootDirectory: {
        type: String,
        default: "."
    },
    buildCommand: {
        type: String
    },
    publishDir: {
        type: String,
        sparse: true
    },
    startCommand: {
        type: String
    },
    port: {
        type: Number,
        default: 3000
    },
    assignedPort: {
        type: Number
    },
    containerId: {
        type: String,
        sparse: true
    },
    internalUrl: {
        type: String,
        sparse: true
    },
    dockerContainerName: {
        type: String,
        unique: true,
        sparse: true
    },
    networkName: {
        type: String,
        required: true,
        index: true
    },
    dockerImage: {
        type: String
    },
    subdomain: {
        type: String,
        required: function () {
            return !this.isMicroservice;
        },
        sparse: true,
        lowercase: true,
        trim: true,
        validate: {
            validator: function (value) {
                if (this.isMicroservice) return !value;
                return Boolean(value) && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value);
            },
            message: 'Subdomain is required when microservice mode is off and must use lowercase letters, numbers, and hyphens'
        }
    },
    customDomains: [{
        type: String,
        lowercase: true,
        trim: true
    }],
    env: [{
        key: String,
        encryptedValue: String
    }],
    monitor: {
        enabled: {
            type: Boolean,
            default: false
        },
        intervalSeconds: {
            type: Number,
            default: 60
        },
        healthPath: {
            type: String,
            default: "/health"
        },
        failedTries: {
            type: Number,
            default: 2
        }
    },
    notifications: {
        discord: {
            enabled: Boolean,
            webhookUrl: String
        },
        telegram: {
            enabled: Boolean,
            botToken: String,
            chatId: String
        },
        email: {
            enabled: Boolean,
            emailAddress: String
        }
    },
    totalBuilds: {
        type: Number,
        default: 0
    }, 
    buildId: {
        type: mongoose.Schema.Types.ObjectId,
    },

    plan: {
        type: String,
        enum: ["free", "starter", "pro"],
        default: "free"
    },
    paymentStatus: {
        type: String,
        enum: ['not_required', 'pending', 'paid', 'failed', 'expired'],
        default: 'not_required',
        index: true
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    paymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CompletedOrder"
    }
}, { timestamps: true });

projectschema.index(
    { userId: 1, dockerContainerName: 1 },
    {
        unique: true,
        partialFilterExpression: {
            dockerContainerName: { $type: 'string' }
        }
    }
);

projectschema.index(
    { subdomain: 1 },
    {
        unique: true,
        partialFilterExpression: {
            isMicroservice: false,
            subdomain: { $exists: true }
        }
    }
);
projectschema.index({ userId: 1, paymentStatus: 1, createdAt: -1 });


export const Project = mongoose.model("Project", projectschema);
