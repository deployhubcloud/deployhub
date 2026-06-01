import axios from 'axios';
import crypto from 'crypto';
import { getUserNetworkName } from '../../../../shared/utils/getUserNetworkName.js';
import { AppError } from '../../../../shared/errors/AppError.js';
import { plans } from '../../../../shared/constants/plan.js';
import { allocatePort } from '../../../../shared/utils/allocatePort.js';
import { project_env } from '../lib/env.js';
import { getRedis } from '../core/redis/client.js';
import { Project } from '../models/project.model.js';
import { PendingOrder } from '../models/PendingOrder.js';
import { CompletedOrder } from '../models/completedOrder.model.js';
import { generateSubdomain } from '../utils/generateSubdomain.js';
import { buildQueue } from '../utils/queues.js';

const PAID_PLANS = Object.keys(plans).filter((plan) => plan !== 'free');

const dockerContainerName = (projectId) => {
    return `cnt_${projectId.toString().substring(0, 6)}_${Math.random().toString(36).substring(2, 8)}`;
};

const getProjectType = (body) => body.projectType || body.type;

const normalizeProjectBody = (body) => {
    const projectType = getProjectType(body);
    const isMicroservice = typeof body.isMicroservice === 'boolean'
        ? body.isMicroservice
        : projectType !== 'static';

    return {
        projectName: body.projectName || body.name,
        projectType,
        isMicroservice,
        repoUrl: body.repoUrl || body.codeLink,
        branch: body.branch || body.branchname || 'main',
        rootDirectory: body.rootDirectory || (body.isFolder ? body.folderName : '.') || '.',
        buildCommand: body.buildCommand,
        publishDir: body.publishDir,
        startCommand: body.startCommand,
        port: Number(body.port || 3000),
        subdomain: body.subdomain,
        env: body.env,
        notifications: body.notifications || {},
        monitor: body.monitor || {},
    };
};

const assertPlanAllowsProject = (planName, projectType) => {
    const plan = plans[planName];

    if (!plan) {
        throw new AppError(`Invalid plan: ${planName}`, 400);
    }

    if (!plan.deployment_Type.includes(projectType)) {
        throw new AppError(
            `${planName} plan does not support ${projectType} projects. Allowed types: ${plan.deployment_Type.join(', ')}`,
            403
        );
    }
};

const normalizeEnv = (env) => {
    if (!env) return [];
    return Object.entries(env).map(([key, value]) => ({
        key,
        encryptedValue: String(value),
    }));
};

const normalizeNotifications = (notifications = {}) => {
    const discordNotification = notifications.discord || {};
    const telegramNotification = notifications.telegram || {};
    const emailNotification = notifications.email || {};

    return {
        discord: {
            enabled: Boolean(discordNotification.enabled),
            webhookUrl: discordNotification.webhookUrl || null,
        },
        telegram: {
            enabled: Boolean(telegramNotification.enabled),
            botToken: telegramNotification.botToken || null,
            chatId: telegramNotification.chatId || null,
        },
        email: {
            enabled: Boolean(emailNotification.enabled),
            emailAddress: emailNotification.emailAddress || null,
        },
    };
};

const planEndDate = (months) => {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + months);
    return endDate;
};

const createRazorpayOrder = async ({ amount, receipt, notes }) => {
    const response = await axios.post(
        'https://api.razorpay.com/v1/orders',
        {
            amount,
            currency: 'INR',
            receipt,
            notes,
        },
        {
            auth: {
                username: project_env.RAZORPAY_KEY_ID,
                password: project_env.RAZORPAY_KEY_SECRET,
            },
            timeout: 10000,
        }
    );

    return response.data;
};

const verifyRazorpaySignature = ({ orderId, paymentId, signature }) => {
    const expectedSignature = crypto
        .createHmac('sha256', project_env.RAZORPAY_KEY_SECRET)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

    if (!signature || signature.length !== expectedSignature.length) {
        return false;
    }

    return crypto.timingSafeEqual(
        Buffer.from(expectedSignature),
        Buffer.from(signature)
    );
};

const planAmountInPaise = (planName, months) => {
    const amount = Number(plans[planName]?.price || 0) * months * 100;
    return Math.round(amount);
};

const queueProjectBuild = async (project) => {
    await buildQueue.add('build', {
        projectId: project._id.toString(),
        plan: project.plan,
    });
};

export const createProjectForPlan = async (userId, body, {
    planName = 'free',
    paymentStatus = 'not_required',
    months = null,
    paymentId = null,
} = {}) => {
    const normalized = normalizeProjectBody(body);
    assertPlanAllowsProject(planName, normalized.projectType);

    const redisclient = getRedis();
    const networkName = await getUserNetworkName(
        axios,
        project_env.IDENTITY_SERVICE_URL,
        userId,
        project_env.INTERNAL_SERVICE_TALKING_SECRET
    );

    const finalSubdomain = normalized.isMicroservice
        ? null
        : normalized.subdomain || await generateSubdomain(Project, normalized.projectName);

    const assignedPort = await allocatePort(redisclient, userId);
    const now = new Date();

    const project = await Project.create({
        userId,
        name: normalized.projectName,
        type: normalized.projectType,
        isMicroservice: normalized.isMicroservice,
        repoUrl: normalized.repoUrl,
        branch: normalized.branch,
        rootDirectory: normalized.rootDirectory,
        buildCommand: normalized.buildCommand,
        publishDir: normalized.publishDir,
        startCommand: normalized.startCommand,
        port: normalized.port,
        assignedPort,
        networkName,
        subdomain: finalSubdomain,
        env: normalizeEnv(normalized.env),
        plan: planName,
        paymentStatus,
        status: 'queued',
        startDate: planName === 'free' ? undefined : now,
        endDate: planName === 'free' ? undefined : planEndDate(months),
        paymentId,
        monitor: {
            enabled: Boolean(plans[planName].uptime_monitoring && normalized.monitor.enabled),
            intervalSeconds: normalized.monitor.intervalSeconds || 60,
            healthPath: normalized.monitor.healthPath || '/health',
            failedTries: normalized.monitor.failedTries || 2,
        },
        notifications: normalizeNotifications(normalized.notifications),
    });

    project.dockerContainerName = normalized.isMicroservice ? dockerContainerName(project._id) : null;
    await project.save({ validateBeforeSave: false });

    if (!normalized.isMicroservice) {
        await redisclient.hset(`deployhub:users:subdomain:${finalSubdomain}`, {
            port: assignedPort,
            projectId: project._id.toString(),
            plan: project.plan,
        });
    }

    await queueProjectBuild(project);

    return { project };
};

export const createFreeProject = async (userId, body) => {
    return createProjectForPlan(userId, body, {
        planName: 'free',
        paymentStatus: 'not_required',
    });
};

export const initPaidProjectPayment = async (userId, body) => {
    const planName = body.plan;
    const months = Number(body.months || 1);
    const normalized = normalizeProjectBody(body);

    if (!PAID_PLANS.includes(planName)) {
        throw new AppError(`Paid project plan must be one of: ${PAID_PLANS.join(', ')}`, 400);
    }
    assertPlanAllowsProject(planName, normalized.projectType);

    const amount = planAmountInPaise(planName, months);
    if (amount <= 0) {
        throw new AppError('Payment amount must be greater than zero', 400);
    }

    const receipt = `project_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const order = await createRazorpayOrder({
        amount,
        receipt,
        notes: {
            userId: userId.toString(),
            plan: planName,
            projectType: normalized.projectType,
        },
    });

    await PendingOrder.create({
        userId,
        orderId: order.id,
        projectData: body,
        months,
        amount,
        plan: planName,
        status: 'pending',
    });

    return {
        order,
        amount,
        plan: planName,
        months,
    };
};

export const verifyPaidProjectPayment = async (userId, body) => {
    const {
        razorpay_order_id: orderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
    } = body;

    if (!orderId || !paymentId || !signature) {
        throw new AppError('Payment verification payload is incomplete', 400);
    }

    const pendingOrder = await PendingOrder.findOne({
        userId,
        orderId,
        status: 'pending',
    });

    if (!pendingOrder) {
        throw new AppError('Pending payment order not found or already processed', 404);
    }

    if (!verifyRazorpaySignature({ orderId, paymentId, signature })) {
        pendingOrder.status = 'failed';
        await pendingOrder.save();
        throw new AppError('Payment signature verification failed', 400);
    }

    const { project } = await createProjectForPlan(userId, pendingOrder.projectData, {
        planName: pendingOrder.plan,
        paymentStatus: 'paid',
        months: pendingOrder.months,
    });

    const completedOrder = await CompletedOrder.create({
        userId,
        orderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: signature,
        months: pendingOrder.months,
        amount: pendingOrder.amount,
        plan: pendingOrder.plan,
        projectId: project._id,
        status: 'completed',
    });

    project.paymentId = completedOrder._id;
    await project.save({ validateBeforeSave: false });

    pendingOrder.status = 'completed';
    await pendingOrder.save();

    return { project, order: completedOrder };
};
