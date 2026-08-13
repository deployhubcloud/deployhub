import mongoose from 'mongoose';

const adminAccountSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            minlength: 3,
            maxlength: 64,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        passwordHash: {
            type: String,
            required: true,
            select: false,
        },
        role: {
            type: String,
            enum: ['normal_admin'],
            default: 'normal_admin',
        },
        status: {
            type: String,
            enum: ['active', 'disabled'],
            default: 'active',
        },
        createdBy: {
            type: String,
            default: 'super_admin',
        },
    },
    { timestamps: true }
);

export const AdminAccount = mongoose.model('AdminAccount', adminAccountSchema);
