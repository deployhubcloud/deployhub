import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { adminEnv } from './src/lib/env.js';
import { connectRedis } from './src/core/redis/client.js';
import { closeDb, connectDb } from './src/core/db/mongo.js';
import { createShutdownHandler } from '../../shared/utils/gracefulShutdown.js';
import adminRouter from './src/routes/index.js';
import { bootSystemMonitor } from './src/services/system.service.js';

const app = express();

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
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

app.use('/', adminRouter);

export default async function startApp(port, serviceName) {
    await connectDb();
    await connectRedis();

    const stopMonitor = bootSystemMonitor();

    const server = app.listen(port, () => {
        console.log(`${serviceName} running on port ${port}`);
    });

    const shutdown = createShutdownHandler({
        server,
        logger: console,
        closeResources: [
            async () => {
                try { stopMonitor?.(); } catch { }
            },
            closeDb,
        ],
    });

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
}
