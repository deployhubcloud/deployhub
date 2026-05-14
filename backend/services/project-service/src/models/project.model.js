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
        enum: ["static", "node", 'java']
    },
    status: {
        type: String,
        enum: ['queued', 'building', 'running', 'failed', 'stopped'],
        default: 'queued'
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
    startCommand: {
        type: String
    },
    port: {
        type: Number,
        default: 3000
    },
    containerId: {
        type: String,
        unique: true,
        index: true
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
        required: true,
        unique: true,
        lowercase: true,
        trim: true
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
            default: true
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
            default: 0
        }
    },
    totalBuilds: {
        type: Number,
        default: 0
    },
    buildId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Build"
    },

    plan: {
        type: String,
        enum: ["free", "pro"],
        default: "free"
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

projectschema.index({ userId: 1, dockerContainerName: 1 }, { unique: true });


