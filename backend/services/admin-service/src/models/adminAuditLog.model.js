import mongoose from 'mongoose';

const adminAuditLogSchema = new mongoose.Schema(
    {
        actorUsername: {
            type: String,
            required: true,
            index: true,
        },
        actorRole: {
            type: String,
            required: true,
        },
        actorAccountId: {
            type: String,
            default: null,
        },
        action: {
            type: String,
            required: true,
            index: true,
        },
        method: {
            type: String,
            required: true,
        },
        path: {
            type: String,
            required: true,
        },
        statusCode: {
            type: Number,
            default: null,
        },
        targetType: {
            type: String,
            default: null,
        },
        targetId: {
            type: String,
            default: null,
        },
        meta: {
            type: mongoose.Schema.Types.Mixed,
            default: null,
        },
        ip: {
            type: String,
            default: '',
        },
        userAgent: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

adminAuditLogSchema.index({ createdAt: -1 });

export const AdminAuditLog = mongoose.model('AdminAuditLog', adminAuditLogSchema);
