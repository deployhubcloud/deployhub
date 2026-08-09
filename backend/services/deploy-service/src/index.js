import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import { DEPLOY_SERVICE_ENV } from "./lib/env.js";
import { closeDb, connectDb } from "./core/db/mongo.js";
import { connectRedis } from "./core/redis/client.js";
import { initRabbitMQ, closeRabbitMQ } from "./core/messageBroker/rabbitMq.js";
import { createShutdownHandler } from "../../../shared/utils/gracefulShutdown.js";
import { createInternalAUthMiddleware } from "../../../shared/middlewares/internalAuth.js";

const app = express();


// security middlewares
app.use(helmet());
app.use(hpp());
app.set("trust proxy", 1);


// parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// health
app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'Healthy' });
});


// internal auth
app.use(createInternalAUthMiddleware({
    secret: DEPLOY_SERVICE_ENV.INTERNAL_SECRET,
    logger: console,
    header: "x-internal-secret",
}));

import adminDeploymentsRouter from "./routes/admin.routes.js";
app.use('/admin', adminDeploymentsRouter);


export default async function startApp(port, service_name) {
    await connectDb();
    await initRabbitMQ();
    await connectRedis();

    const server = app.listen(port, () => {
        console.log(`${service_name} running on port ${port}`);
    });

    const shutdown = createShutdownHandler({
        server,
        logger: console,
        closeResources: [closeRabbitMQ, closeDb],
    });

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
