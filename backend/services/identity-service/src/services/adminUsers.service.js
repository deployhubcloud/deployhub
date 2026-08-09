import { User } from '../models/user.model.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { createSessionKey, deleteAllSessions } from './session.service.js';
import { getRedis } from '../core/redis/client.js';

export const listUsersForAdmin = async ({ page = 1, limit = 50, q = '', status } = {}) => {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (status) filter.status = status;
    if (q) {
        filter.$or = [
            { email: { $regex: q, $options: 'i' } },
            { fullName: { $regex: q, $options: 'i' } },
            { githubUsername: { $regex: q, $options: 'i' } },
        ];
    }

    const [users, total] = await Promise.all([
        User.find(filter)
            .select('fullName email provider status githubUsername githubId networkName profilePic createdAt updatedAt lockUntil loginAttempts')
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
        .select('fullName email provider status githubUsername githubId networkName profilePic createdAt updatedAt lockUntil loginAttempts')
        .lean();
    if (!user) throw new AppError('User not found', 404);

    const redis = getRedis();
    const sessions = [];
    let cursor = '0';
    const pattern = createSessionKey(userId, '*');

    do {
        const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = next;
        for (const key of keys) {
            const raw = await redis.get(key);
            if (!raw) continue;
            try {
                const parsed = JSON.parse(raw);
                sessions.push({
                    key,
                    tokenId: key.split(':').pop(),
                    ip: parsed.ip,
                    device: parsed.device,
                    userAgent: parsed.userAgent,
                    createdAt: parsed.createdAt,
                });
            } catch {
                sessions.push({ key });
            }
        }
    } while (cursor !== '0');

    return { user, sessions };
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
    if (body.networkName !== undefined) allowed.networkName = body.networkName;

    const user = await User.findByIdAndUpdate(
        userId,
        { $set: allowed },
        { new: true }
    ).select('fullName email provider status githubUsername githubId networkName profilePic createdAt updatedAt lockUntil loginAttempts');

    if (!user) throw new AppError('User not found', 404);

    if (body.status === 'suspend' || body.revokeSessions) {
        await deleteAllSessions(getRedis(), userId);
    }

    return { user };
};

export const revokeUserSessionsForAdmin = async (userId) => {
    const user = await User.findById(userId).select('_id');
    if (!user) throw new AppError('User not found', 404);
    await deleteAllSessions(getRedis(), userId);
    return { message: 'All sessions revoked', userId };
};

export const deleteUserForAdmin = async (userId) => {
    const user = await User.findByIdAndDelete(userId);
    if (!user) throw new AppError('User not found', 404);
    await deleteAllSessions(getRedis(), userId);
    return { message: 'User deleted', userId };
};

export const userStatsForAdmin = async () => {
    const [total, byStatus, byProvider] = await Promise.all([
        User.countDocuments(),
        User.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
        User.aggregate([{ $group: { _id: '$provider', count: { $sum: 1 } } }]),
    ]);
    return {
        total,
        byStatus: Object.fromEntries(byStatus.map((x) => [x._id || 'unknown', x.count])),
        byProvider: Object.fromEntries(byProvider.map((x) => [x._id || 'unknown', x.count])),
    };
};
