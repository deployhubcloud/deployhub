import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { adminEnv } from './src/lib/env.js';
import { connectRedis } from './src/core/redis/client.js';
import { createShutdownHandler } from '../../shared/utils/gracefulShutdown.js';
import { createInternalAUthMiddleware } from '../../shared/middlewares/internalAuth.js';
import adminRouter from './src/routes/index.js';

const app = express();

app.use(helmet());
app.use(hpp());
app.set('trust proxy', 1);

app.use(cors({
    origin: adminEnv.ADMIN_FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'Healthy', service: 'admin-service' });
});

// Gateway injects x-internal-secret;
app.use(createInternalAUthMiddleware({
    secret: adminEnv.INTERNAL_SECRET,
    logger: console,
    header: 'x-internal-secret',
}));

app.use('/', adminRouter);

export default async function startApp(port, serviceName) {
    await connectRedis();

    const server = app.listen(port, () => {
        console.log(`${serviceName} running on port ${port}`);
    });

    const shutdown = createShutdownHandler({
        server,
        logger: console,
        closeResources: [],
    });

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
