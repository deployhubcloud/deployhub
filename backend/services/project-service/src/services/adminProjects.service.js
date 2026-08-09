import { Project } from '../models/project.model.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { deleteProjectQueue } from '../utils/queues.js';
import { getRedis } from '../core/redis/client.js';
import { clearCacheProjectData } from '../../../../shared/utils/cacheProjectData.js';

export const listProjectsForAdmin = async ({ userId, page = 1, limit = 50, q = '' } = {}) => {
    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(100, Math.max(1, Number(limit) || 50));
    const skip = (pageNum - 1) * limitNum;

    const filter = { status: { $ne: 'deleted' } };
    if (userId) filter.userId = userId;
    if (q) {
        filter.$or = [
            { name: { $regex: q, $options: 'i' } },
            { subdomain: { $regex: q, $options: 'i' } },
            { customDomains: { $regex: q, $options: 'i' } },
        ];
    }

    const [projects, total] = await Promise.all([
        Project.find(filter)
            .select('userId name type status plan subdomain customDomains assignedPort port repoUrl branch dockerContainerName networkName isMicroservice createdAt updatedAt')
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
    if (!project || project.status === 'deleted') {
        throw new AppError('Project not found', 404);
    }
    return { project };
};

export const updateProjectForAdmin = async (projectId, body = {}) => {
    const allowed = {};
    const fields = [
        'name', 'status', 'plan', 'branch', 'buildCommand', 'startCommand',
        'publishDir', 'rootDirectory', 'port', 'subdomain',
    ];

    for (const key of fields) {
        if (body[key] !== undefined) allowed[key] = body[key];
    }

    if (Array.isArray(body.customDomains)) {
        allowed.customDomains = body.customDomains.map((d) => String(d).toLowerCase().trim());
    }

    const project = await Project.findByIdAndUpdate(
        projectId,
        { $set: allowed },
        { new: true }
    );

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
