import { User } from '../models/user.model.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { deleteAllSessions } from './session.service.js';
import { getRedis } from '../core/redis/client.js';

export const listUsersForAdmin = async ({ page = 1, limit = 50, q = '' } = {}) => {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (q) {
        filter.$or = [
            { email: { $regex: q, $options: 'i' } },
            { fullName: { $regex: q, $options: 'i' } },
            { githubUsername: { $regex: q, $options: 'i' } },
        ];
    }

    const [users, total] = await Promise.all([
        User.find(filter)
            .select('fullName email provider status githubUsername networkName profilePic createdAt updatedAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        User.countDocuments(filter),
    ]);

    return {
        users,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum) || 1,
        },
    };
};

export const getUserForAdmin = async (userId) => {
    const user = await User.findById(userId)
        .select('fullName email provider status githubUsername networkName profilePic createdAt updatedAt')
        .lean();
    if (!user) throw new AppError('User not found', 404);
    return { user };
};

export const updateUserForAdmin = async (userId, body = {}) => {
    const allowed = {};
    if (body.fullName !== undefined) allowed.fullName = String(body.fullName).trim();
    if (body.status !== undefined) {
        if (!['pending', 'active', 'suspend'].includes(body.status)) {
            throw new AppError('Invalid status', 400);
        }
        allowed.status = body.status;
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: allowed },
        { new: true }
    ).select('fullName email provider status githubUsername networkName profilePic createdAt updatedAt');

    if (!user) throw new AppError('User not found', 404);

    if (body.status === 'suspend') {
        await deleteAllSessions(getRedis(), userId);
    }

    return { user };
};

export const deleteUserForAdmin = async (userId) => {
    const user = await User.findByIdAndDelete(userId);
    if (!user) throw new AppError('User not found', 404);
    await deleteAllSessions(getRedis(), userId);
    return { message: 'User deleted', userId };
};
