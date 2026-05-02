import { ENV } from './src/lib/env.js';
import { startHealthCheck } from './src/middlewares/healthCheck.js'
import { connectRedis } from './src/configs/redis.js';
import { services } from './src/configs/services.js';
import { createShutdownHandler } from '../shared/utils/gracefulShutdown.js';
import express from 'express';
import routes from './src/routes/index.js';

const app = express();


// set cors
import cors from 'cors'
import { corsOption } from './src/utils/cors.js';
app.use(cors(corsOption))


// trace middleware
import { traceMiddleware } from './src/middlewares/trace.middleware.js';
app.use(traceMiddleware);


// health
app.get('/gateway/status', (req, res) => {
    res.json(services);
});

app.use('/', routes);


export default async function startApp() {
    await connectRedis();
    const interval = startHealthCheck();

    const server = app.listen(ENV.PORT, () => {
        console.log(`Api Gateway is running on port ${ENV.PORT}`);
    });

    const shutdown = createShutdownHandler({
        server,
        logger: console,
        closeResources: [
            () => clearInterval(interval),
        ],
    });

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
