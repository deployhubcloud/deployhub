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
        enum: ["static", "node"]
    },
    status: {
        type: String,
        enum: ['draft', 'queued', 'building', 'running', 'failed', 'stopped'],
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
            default: 0
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

projectschema.index({ userId: 1, dockerContainerName: 1 }, { unique: true });
projectschema.index({ userId: 1, paymentStatus: 1, createdAt: -1 });


export const Project = mongoose.model("Project", projectschema);
