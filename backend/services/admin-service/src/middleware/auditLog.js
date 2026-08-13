import { AdminAuditLog } from '../models/adminAuditLog.model.js';
import { ROLES } from '../constants/roles.js';

function inferTarget(path = '') {
    const userMatch = path.match(/\/users\/([^/]+)/);
    if (userMatch) return { targetType: 'user', targetId: userMatch[1] };
    const projectMatch = path.match(/\/projects\/([^/]+)/);
    if (projectMatch) return { targetType: 'project', targetId: projectMatch[1] };
    const adminMatch = path.match(/\/admins\/([^/]+)/);
    if (adminMatch) return { targetType: 'admin', targetId: adminMatch[1] };
    return { targetType: null, targetId: null };
}

export function auditNormalAdminMiddleware(req, res, next) {
    const session = req.adminSession;
    if (!session || session.role !== ROLES.NORMAL_ADMIN) {
        return next();
    }

    const path = req.originalUrl?.split('?')[0] || req.path || '';
    const started = Date.now();
    const { targetType, targetId } = inferTarget(path);

    res.on('finish', () => {
        AdminAuditLog.create({
            actorUsername: session.username || session.adminId,
            actorRole: session.role,
            actorAccountId: session.accountId || null,
            action: `${req.method} ${path}`,
            method: req.method,
            path,
            statusCode: res.statusCode,
            targetType,
            targetId,
            meta: {
                durationMs: Date.now() - started,
                query: req.query || {},
            },
            ip: req.ip || '',
            userAgent: req.headers?.['user-agent'] || '',
        }).catch((err) => {
            console.warn('[admin-audit] failed to write log:', err.message);
        });
    });

    next();
}

export async function listAuditLogs(params = {}) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 50));
    const filter = {};

    if (params.actor) {
        filter.actorUsername = String(params.actor).trim().toLowerCase();
    }
    if (params.action) {
        filter.action = { $regex: String(params.action).trim(), $options: 'i' };
    }
    if (params.from || params.to) {
        filter.createdAt = {};
        if (params.from) filter.createdAt.$gte = new Date(params.from);
        if (params.to) filter.createdAt.$lte = new Date(params.to);
    }

    const [logs, total] = await Promise.all([
        AdminAuditLog.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean(),
        AdminAuditLog.countDocuments(filter),
    ]);

    return {
        logs,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit) || 1,
        },
    };
}
