import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import { agentEnv } from './src/lib/env.js';
import { connectRedis } from './src/core/redis/client.js';
import { createShutdownHandler } from '../../shared/utils/gracefulShutdown.js';
import { createInternalAUthMiddleware } from '../../shared/middlewares/internalAuth.js';
import userContext from '../../shared/middlewares/userContext.js';
import agentRouter from './src/routes/index.js';

const app = express();

app.use(helmet());
app.use(hpp());
app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'Healthy', service: 'agent-service' });
});

app.use(createInternalAUthMiddleware({
    secret: agentEnv.INTERNAL_SECRET,
    logger: console,
    header: 'x-internal-secret',
}));

app.use(userContext);
app.use('/', agentRouter);

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
