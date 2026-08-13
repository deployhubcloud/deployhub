import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { AppError } from '../../../../shared/errors/AppError.js';
import { AdminAccount } from '../models/adminAccount.model.js';
import { adminEnv } from '../lib/env.js';

function normalizeUsername(username) {
    return String(username || '').trim().toLowerCase();
}

function normalizeEmail(email) {
    return String(email || '').trim().toLowerCase();
}

export async function listAdmins() {
    const admins = await AdminAccount.find({})
        .sort({ createdAt: -1 })
        .select('-passwordHash')
        .lean();

    return {
        admins: admins.map((a) => ({
            id: String(a._id),
            username: a.username,
            email: a.email,
            role: a.role,
            status: a.status,
            createdBy: a.createdBy,
            createdAt: a.createdAt,
            updatedAt: a.updatedAt,
        })),
    };
}

export async function createAdmin({ username, password, email, createdBy }) {
    const user = normalizeUsername(username);
    const mail = normalizeEmail(email);
    const pass = String(password || '');

    if (!user || user.length < 3) {
        throw new AppError('username must be at least 3 characters', 400);
    }
    if (!mail || !mail.includes('@')) {
        throw new AppError('valid email is required', 400);
    }
    if (pass.length < 8) {
        throw new AppError('password must be at least 8 characters', 400);
    }
    if (user === String(adminEnv.ADMIN_ID).trim().toLowerCase()) {
        throw new AppError('username is reserved for super admin', 400);
    }

    const exists = await AdminAccount.findOne({
        $or: [{ username: user }, { email: mail }],
    }).lean();
    if (exists) {
        throw new AppError('username or email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(pass, adminEnv.BCRYPT_ROUNDS);
    const doc = await AdminAccount.create({
        username: user,
        email: mail,
        passwordHash,
        role: 'normal_admin',
        status: 'active',
        createdBy: createdBy || 'super_admin',
    });

    return {
        admin: {
            id: String(doc._id),
            username: doc.username,
            email: doc.email,
            role: doc.role,
            status: doc.status,
            createdAt: doc.createdAt,
        },
    };
}

function findAccountOrThrow(adminId) {
    if (!mongoose.isValidObjectId(adminId)) {
        throw new AppError('Admin not found', 404);
    }
}

export async function updateAdmin(adminId, body = {}) {
    findAccountOrThrow(adminId);
    const account = await AdminAccount.findById(adminId).select('+passwordHash');
    if (!account) throw new AppError('Admin not found', 404);

    if (body.status) {
        if (!['active', 'disabled'].includes(body.status)) {
            throw new AppError('invalid status', 400);
        }
        account.status = body.status;
    }

    if (body.password) {
        const pass = String(body.password);
        if (pass.length < 8) {
            throw new AppError('password must be at least 8 characters', 400);
        }
        account.passwordHash = await bcrypt.hash(pass, adminEnv.BCRYPT_ROUNDS);
    }

    if (body.email) {
        const mail = normalizeEmail(body.email);
        const clash = await AdminAccount.findOne({
            email: mail,
            _id: { $ne: account._id },
        }).lean();
        if (clash) throw new AppError('email already in use', 409);
        account.email = mail;
    }

    await account.save();

    return {
        admin: {
            id: String(account._id),
            username: account.username,
            email: account.email,
            role: account.role,
            status: account.status,
            updatedAt: account.updatedAt,
        },
    };
}

export async function deleteAdmin(adminId) {
    findAccountOrThrow(adminId);
    const account = await AdminAccount.findByIdAndDelete(adminId);
    if (!account) throw new AppError('Admin not found', 404);
    return { message: 'Admin deleted', id: String(account._id), username: account.username };
}
