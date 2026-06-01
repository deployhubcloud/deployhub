import { ENV } from './src/lib/env.js';
import { startHealthCheck } from './src/middlewares/healthCheck.js'
import { connectRedis } from './src/configs/redis.js';
import { services } from './src/configs/services.js';
import { createShutdownHandler } from '../shared/utils/gracefulShutdown.js';
import express from 'express';
import routes from './src/routes/index.js';
import compression from 'compression';
import cookieParser from 'cookie-parser';


// create express app
const app = express();


// set cors
import cors from 'cors'
import { corsOption } from './src/utils/cors.js';
app.use(cors(corsOption))


// trace middleware
import { traceMiddleware } from './src/middlewares/trace.middleware.js';
app.use(traceMiddleware);


// trust proxy for rate limiting and real ip
app.set("trust proxy", 1);


//compression
app.use(compression());


// cookie parser
app.use(cookieParser());



// health
app.get('/gateway/status', (req, res) => {
    res.json(services);
});
app.use('/api', routes);


export default async function startApp(port) {
    await connectRedis();
    const interval = await startHealthCheck();

    const server = app.listen(port, () => {
        console.log(`Api Gateway is running on port ${port}`);
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
