import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import { buildEnv } from "./lib/env.js";
import { closeDb, connectDb } from "./core/db/mongo.js";
import { connectRedis } from "./core/redis/client.js";
import { initRabbitMQ, closeRabbitMQ } from "./core/messageBroker/rabbitMq.js";
import { createShutdownHandler } from "../../../shared/utils/gracefulShutdown.js";
import { createInternalAUthMiddleware } from "../../../shared/middlewares/internalAuth.js";

const app = express();


// security
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
    secret: buildEnv.INTERNAL_SECRET,
    logger: console,
    header: "x-internal-secret",
}));



// ye route other microsrvice liye hai taki wo data fetch akr sake
import forOtherServices from "./routes/forOtherSrvice.js";
app.use('/for-other-service', forOtherServices)

import adminBuildsRouter from "./routes/admin.routes.js";
app.use('/admin', adminBuildsRouter)

// ye user chec kakrne ke liye hai means agar user routes pe req ja raha hai jab req.user hona chiaye
import userContext from "../../../shared/middlewares/userContext.js";
app.use(userContext);



// routes
import buildRouter from "./routes/router.js"
app.use('/', buildRouter);


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
