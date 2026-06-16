import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import { env } from "./lib/env.js";
import { monitoringDbClose, monitoringDbConnect } from "./core/db/mongodb.js";
import { connectRedis } from "./core/redis/client.js";
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
    secret: env.INTERNAL_SECRET,
    logger: console,
    header: "x-internal-secret",
}));


export default async function startApp() {
    await monitoringDbConnect();
    await connectRedis();

    const server = app.listen(env.PORT, () => {
        console.log(`Auth server running on port ${env.PORT}`);
    });

    const shutdown = createShutdownHandler({
        server,
        logger: console,
        closeResources: [monitoringDbClose],
    });

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
