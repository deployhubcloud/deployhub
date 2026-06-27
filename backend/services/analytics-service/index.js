import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import { env } from "./src/lib/env.js";
import { connectRedis } from "./src/redis/client.js"
import { createShutdownHandler } from "../../shared/utils/gracefulShutdown.js";
import { createInternalAUthMiddleware } from "../../shared/middlewares/internalAuth.js";
import { print } from "./src/config/logger.js";


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
    res.status(200).json({ success: true, message: 'Healthy', service: "Analytics" });
});


// internal auth
app.use(createInternalAUthMiddleware({
    secret: env.INTERNAL_SECRET,
    logger: console,
    header: "x-internal-secret",
}));


// ye user chec kakrne ke liye hai means agar user routes pe req ja raha hai jab req.user hona chiaye
import userContext from "../../shared/middlewares/userContext.js";
app.use(userContext);



// routes
import analyticsRouter from "./src/router/analytics.router.js"
app.use('/', analyticsRouter);


export default async function startApp(port, service_name) {
    await connectRedis();

    const server = app.listen(port, () => {
        console.log(`${service_name} running on port ${port}`);
    });

    const shutdown = createShutdownHandler({
        server,
        logger: print,
        closeResources: [],
    });

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
