import { validationResult } from 'express-validator';
import { AppError } from '../../../../shared/errors/AppError.js';
import { createFreeProject } from '../services/project.service.js';
import { getRedis } from '../core/redis/client.js';

const sendError = (res, error) => {
    const status = error?.status || 500;
    return res.status(status).json({
        success: false,
        message: error?.msg || 'Internal server error',
    });
};

export const createProject = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: errors.array()[0].msg,
            });
        }

        const user = req.user;
        const requestedPlan = req.body.plan || 'free';

        if (requestedPlan !== 'free') {
            throw new AppError('Use /payment/init for paid project plans', 402);
        }

        const { project } = await createFreeProject(user._id, req.body);


        const redisKey = `deployhub:RateLimit:${req.user._id}:service:project:createFreeProject`;

        const redis = getRedis();
        const count = await redis.incr(redisKey);

        if ((Number(count) || 0) === 0) {
            await redis.expire(redisKey, 2592000);
        }


        return res.status(201).json({
            success: true,
            message: 'Free project created and queued',
            projectId: project._id,
            project,
            subdomain: project.subdomain,
            internalUrl: project.internalUrl,
            status: project.status,
        });
    } catch (error) {
        console.error('createProject error:', error);
        return sendError(res, error);
    }
};
