import { Project } from '../models/project.model.js';
import { Port } from '../models/port.model.js';
import { SslCertificate } from '../models/sslCertificate.js';
import { PendingOrder } from '../models/PendingOrder.js';
import { CompletedOrder } from '../models/completedOrder.model.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { deleteProjectQueue } from '../utils/queues.js';
import { getRedis } from '../core/redis/client.js';
import { clearCacheProjectData } from '../../../../shared/utils/cacheProjectData.js';
import { cacheKey } from '../../../../shared/cache/cacheKey.js';

async function readRedisSnapshot(redis, project) {
    const projectId = String(project._id);
    const keys = {
        projectCache: `deployhub:users:project:${projectId}`,
        projectMeta: `deployhub:users:project:${projectId}:meta`,
        buildsCache: `deployhub:users:project:${projectId}:builds`,
        notifications: `deployhub:project:${projectId}:notifications-settings`,
        latestBuild: `deployhub:project:latestbuildId:${projectId}`,
        statusStream: `deployhub:users:projects:status:${projectId}`,
        monitoring: `deployhub:user:project:${projectId}:monitoring`,
        subdomain: project.subdomain ? `deployhub:users:subdomain:${project.subdomain}` : null,
        port: project.assignedPort ? `deployhub:port:${project.assignedPort}` : null,
    };

    const snapshot = {};
    for (const [label, key] of Object.entries(keys)) {
        if (!key) {
            snapshot[label] = null;
            continue;
        }
        const type = await redis.type(key);
        if (type === 'none') {
            snapshot[label] = { key, exists: false };
        } else if (type === 'string') {
            snapshot[label] = { key, exists: true, type, value: await redis.get(key) };
        } else if (type === 'hash') {
            snapshot[label] = { key, exists: true, type, value: await redis.hgetall(key) };
        } else if (type === 'stream') {
            const len = await redis.xlen(key);
            snapshot[label] = { key, exists: true, type, length: len };
        } else {
            snapshot[label] = { key, exists: true, type };
        }
    }

    const customDomains = {};
    for (const domain of project.customDomains || []) {
        const key = `deployhub:users:customdomain:${domain}`;
        customDomains[domain] = {
            key,
            exists: Boolean(await redis.exists(key)),
            value: await redis.hgetall(key),
        };
    }

    return { ...snapshot, customDomains };
}

export const listProjectsForAdmin = async ({
    userId,
    page = 1,
    limit = 50,
    q = '',
    status,
    plan,
    type,
    includeDeleted = false,
} = {}) => {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const filter = {};
    if (!includeDeleted || includeDeleted === 'false') {
        filter.status = { $ne: 'deleted' };
    }
    if (status) filter.status = status;
    if (plan) filter.plan = plan;
    if (type) filter.type = type;
    if (userId) filter.userId = userId;
    if (q) {
        filter.$or = [
            { name: { $regex: q, $options: 'i' } },
            { subdomain: { $regex: q, $options: 'i' } },
            { customDomains: { $regex: q, $options: 'i' } },
            { repoUrl: { $regex: q, $options: 'i' } },
        ];
    }

    const [projects, total] = await Promise.all([
        Project.find(filter)
            .select('userId name type status plan subdomain customDomains assignedPort port repoUrl branch dockerContainerName networkName isMicroservice paymentStatus totalBuilds createdAt updatedAt')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limitNum)
            .lean(),
        Project.countDocuments(filter),
    ]);

    return {
        projects,
        pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum) || 1,
        },
    };
};

export const getProjectForAdmin = async (projectId) => {
    const project = await Project.findById(projectId).lean();
    if (!project) throw new AppError('Project not found', 404);

    const redis = getRedis();
    const [port, sslCerts, pendingOrders, completedOrders, redisSnapshot] = await Promise.all([
        Port.findOne({ projectId }).lean(),
        SslCertificate.find({ projectId }).lean(),
        PendingOrder.find({ projectId }).sort({ createdAt: -1 }).lean(),
        CompletedOrder.find({ projectId }).sort({ createdAt: -1 }).lean(),
        readRedisSnapshot(redis, project),
    ]);

    const safeProject = {
        ...project,
        env: Array.isArray(project.env)
            ? project.env.map((item) => ({
                key: item.key,
                hasValue: Boolean(item.encryptedValue),
            }))
            : [],
    };

    return {
        project: safeProject,
        port,
        sslCertificates: sslCerts,
        billing: {
            pendingOrders,
            completedOrders,
        },
        redis: redisSnapshot,
        urls: {
            public: project.subdomain
                ? `https://${project.subdomain}.deployhub.online`
                : null,
            customDomains: project.customDomains || [],
            internal: project.internalUrl || null,
        },
    };
};

export const updateProjectForAdmin = async (projectId, body = {}) => {
    const allowed = {};
    const fields = [
        'name', 'status', 'plan', 'branch', 'buildCommand', 'startCommand',
        'publishDir', 'rootDirectory', 'port', 'subdomain', 'repoUrl',
        'paymentStatus', 'version', 'isMicroservice', 'assignedPort',
        'dockerContainerName', 'networkName', 'dockerImage', 'containerId',
        'internalUrl', 'totalBuilds',
    ];

    for (const key of fields) {
        if (body[key] !== undefined) allowed[key] = body[key];
    }

    if (Array.isArray(body.customDomains)) {
        allowed.customDomains = body.customDomains.map((d) => String(d).toLowerCase().trim());
    }

    if (body.monitor && typeof body.monitor === 'object') {
        for (const [k, v] of Object.entries(body.monitor)) {
            allowed[`monitor.${k}`] = v;
        }
    }

    if (body.notifications && typeof body.notifications === 'object') {
        allowed.notifications = body.notifications;
    }

    const project = await Project.findByIdAndUpdate(
        projectId,
        { $set: allowed },
        { new: true }
    ).lean();

    if (!project) throw new AppError('Project not found', 404);

    const redis = getRedis();
    await clearCacheProjectData(projectId, redis);

    if (project.subdomain && project.assignedPort) {
        await redis.hset(`deployhub:users:subdomain:${project.subdomain}`, {
            port: project.assignedPort,
            projectId: project._id.toString(),
            plan: project.plan,
        });
    }

    return { project };
};

export const deleteProjectForAdmin = async (projectId) => {
    const project = await Project.findById(projectId);
    if (!project) throw new AppError('Project not found', 404);

    project.status = 'deleted';
    await project.save({ validateBeforeSave: false });

    await deleteProjectQueue.add('delete-project', { projectId: project._id.toString() });

    const redis = getRedis();
    await clearCacheProjectData(projectId, redis);

    return { message: 'Project delete queued', projectId: project._id.toString() };
};

export const deleteProjectsByUserForAdmin = async (userId) => {
    const projects = await Project.find({
        userId,
        status: { $ne: 'deleted' },
    }).select('_id');

    const ids = [];
    for (const p of projects) {
        await deleteProjectForAdmin(p._id.toString());
        ids.push(p._id.toString());
    }

    return {
        message: `Queued ${ids.length} project deletes`,
        projectIds: ids,
    };
};

export const purgeProjectCacheForAdmin = async (projectId) => {
    const project = await Project.findById(projectId).lean();
    if (!project) throw new AppError('Project not found', 404);

    const redis = getRedis();
    const snapshot = await readRedisSnapshot(redis, project);
    const keys = Object.values(snapshot)
        .filter((v) => v && v.key)
        .map((v) => v.key);

    for (const domain of Object.keys(snapshot.customDomains || {})) {
        keys.push(`deployhub:users:customdomain:${domain}`);
    }

    keys.push(cacheKey.deleteProjectSchedule());
    if (keys.length) await redis.del(...keys.filter((k) => k !== cacheKey.deleteProjectSchedule()));
    await redis.zrem(cacheKey.deleteProjectSchedule(), String(projectId));
    await redis.zrem('deployhub:monitoring:schedule', String(projectId));
    await clearCacheProjectData(projectId, redis);

    return { message: 'Project cache purged', deletedKeys: keys };
};

export const adminProjectStats = async () => {
    const [total, running, failed, byPlan, byType, byStatus] = await Promise.all([
        Project.countDocuments({ status: { $ne: 'deleted' } }),
        Project.countDocuments({ status: 'running' }),
        Project.countDocuments({ status: 'failed' }),
        Project.aggregate([
            { $match: { status: { $ne: 'deleted' } } },
            { $group: { _id: '$plan', count: { $sum: 1 } } },
        ]),
        Project.aggregate([
            { $match: { status: { $ne: 'deleted' } } },
            { $group: { _id: '$type', count: { $sum: 1 } } },
        ]),
        Project.aggregate([
            { $match: { status: { $ne: 'deleted' } } },
            { $group: { _id: '$status', count: { $sum: 1 } } },
        ]),
    ]);

    return {
        total,
        running,
        failed,
        byPlan: Object.fromEntries(byPlan.map((x) => [x._id || 'unknown', x.count])),
        byType: Object.fromEntries(byType.map((x) => [x._id || 'unknown', x.count])),
        byStatus: Object.fromEntries(byStatus.map((x) => [x._id || 'unknown', x.count])),
    };
};
