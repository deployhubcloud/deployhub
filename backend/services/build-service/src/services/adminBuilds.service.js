import { Build } from '../models/build.model.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { buildEnv } from '../lib/env.js';
import { getRedis } from '../core/redis/client.js';
import { deleteCacheBuildData } from '../utils/cacheBuildData.js';

export const listBuildsForAdmin = async ({ projectId, userId, page = 1, limit = 50 } = {}) => {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (projectId) filter.project = projectId;
    if (userId) filter.userId = userId;

    const [builds, total] = await Promise.all([
        Build.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
        Build.countDocuments(filter),
    ]);

    return {
        builds,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum) || 1,
        },
    };
};

export const deleteBuildsForProjectAdmin = async (projectId) => {
    const result = await Build.deleteMany({ project: projectId });
    await deleteCacheBuildData(projectId);
    const redis = getRedis();
    await redis.del(`deployhub:project:latestbuildId:${projectId}`);
    return { deletedCount: result.deletedCount, projectId };
};

export const deleteBuildByIdAdmin = async (buildId) => {
    const build = await Build.findByIdAndDelete(buildId);
    if (!build) throw new AppError('Build not found', 404);
    if (build.project) await deleteCacheBuildData(build.project.toString());
    return { message: 'Build deleted', buildId };
};

export const buildStatsForAdmin = async () => {
    const [total, byStatus] = await Promise.all([
        Build.countDocuments(),
        Build.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);
    return {
        total,
        byStatus: Object.fromEntries(byStatus.map((x) => [x._id || 'unknown', x.count])),
        service: buildEnv.SERVICE_NAME,
    };
};
