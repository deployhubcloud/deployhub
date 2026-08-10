import { AppError } from '../../../../shared/errors/AppError.js';
import { Project } from '../models/project.model.js';
import { getRedis } from '../core/redis/client.js';

export const getProjectLiveStatus = async (userId, projectId) => {
    const project = await Project.findOne({
        _id: projectId,
        userId,
        status: { $ne: 'deleted' },
    }).select('_id name status type').lean();

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    const redis = getRedis();
    const streamKey = `deployhub:users:projects:status:${projectId}`;
    const entries = await redis.xrevrange(streamKey, '+', '-', 'COUNT', 1);

    let liveStatus = null;
    let timestamp = null;
    if (entries?.length) {
        const fields = entries[0][1];
        for (let i = 0; i < fields.length; i += 2) {
            if (fields[i] === 'status') liveStatus = fields[i + 1];
            if (fields[i] === 'timestamp') timestamp = Number(fields[i + 1]);
        }
    }

    return {
        projectId: project._id,
        name: project.name,
        type: project.type,
        dbStatus: project.status,
        liveStatus,
        timestamp,
    };
};

export const getEnvKeysOnly = async (userId, projectId) => {
    const project = await Project.findOne({
        _id: projectId,
        userId,
        status: { $ne: 'deleted' },
    }).select('env name').lean();

    if (!project) {
        throw new AppError('Project not found', 404);
    }

    const keys = Array.isArray(project.env)
        ? project.env.map((e) => e.key).filter(Boolean)
        : [];

    return {
        projectId,
        projectName: project.name,
        envKeys: keys,
        envCount: keys.length,
    };
};

export const mergeEnvSettings = async (userId, projectId, { patch = {}, removeKeys = [] } = {}) => {
    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) {
        throw new AppError('patch must be a key-value object', 400);
    }
    if (!Array.isArray(removeKeys)) {
        throw new AppError('removeKeys must be an array', 400);
    }

    for (const [key, value] of Object.entries(patch)) {
        if (!String(key).trim()) throw new AppError('Empty env key not allowed', 400);
        if (!String(value).trim()) throw new AppError(`Value for '${key}' cannot be empty`, 400);
        if (String(key).length > 128) throw new AppError('Env key too long', 400);
        if (String(value).length > 4096) throw new AppError(`Value for '${key}' too long`, 400);
    }

    for (const key of removeKeys) {
        if (!String(key).trim()) throw new AppError('Empty remove key not allowed', 400);
    }

    const existing = await Project.findOne({
        _id: projectId,
        userId,
        status: { $ne: 'deleted' },
    }).select('env');

    if (!existing) throw new AppError('Project not found', 404);

    const envMap = new Map();
    for (const item of existing.env || []) {
        envMap.set(item.key, item.encryptedValue);
    }

    for (const [key, value] of Object.entries(patch)) {
        envMap.set(String(key).trim(), String(value));
    }
    for (const key of removeKeys) {
        envMap.delete(String(key).trim());
    }

    if (envMap.size > 100) {
        throw new AppError('Too many environment variables (max 100)', 400);
    }

    const envArray = Array.from(envMap.entries()).map(([key, encryptedValue]) => ({
        key,
        encryptedValue,
    }));

    await Project.findOneAndUpdate(
        { _id: projectId, userId },
        { $set: { env: envArray } }
    );

    return {
        success: true,
        envKeys: Array.from(envMap.keys()),
        updatedKeys: Object.keys(patch).map((k) => String(k).trim()),
        removedKeys: removeKeys.map((k) => String(k).trim()),
    };
};
