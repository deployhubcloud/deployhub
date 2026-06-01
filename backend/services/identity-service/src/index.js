// app.js — sab kuch yahan, normal static imports
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import { AUTH_ENV } from "./lib/env.js";
import { closeDb, connectDb } from "./core/db/mongo.js";
import { connectRedis } from "./core/redis/client.js";
import { initRabbitMQ, closeRabbitMQ } from "./core/messageBroker/rabbitMq.js";
import { createShutdownHandler } from "../../../shared/utils/gracefulShutdown.js";
import { createInternalAUthMiddleware } from "../../../shared/middlewares/internalAuth.js";
import identityRouter from "./routes/routes.js";

const app = express();


// security
app.use(helmet());
app.use(hpp());
app.set("trust proxy", 1);


// parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// health
app.get('/health', (_req, res) => {
    res.status(200).json({ success: true, message: 'Healthy' });
});


// internal auth
app.use(createInternalAUthMiddleware({
    secret: AUTH_ENV.INTERNAL_SECRET,
    logger: console,
    header: "x-internal-secret",
}));


app.use('/', identityRouter);


export default async function startApp(port) {
    await connectDb();
    await initRabbitMQ();
    await connectRedis();

    const server = app.listen(port, () => {
        console.log(`Auth server running on port ${port}`);
    });

    const shutdown = createShutdownHandler({
        server,
        logger: console,
        closeResources: [closeRabbitMQ, closeDb],
    });

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
