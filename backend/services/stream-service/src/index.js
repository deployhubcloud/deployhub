// app.js — sab kuch yahan, normal static imports
import express from "express";
import helmet from "helmet";
import hpp from "hpp";
import { env } from "./lib/env.js";
import { connectRedis } from "./core/redis/client.js";
import { createShutdownHandler } from "../../../shared/utils/gracefulShutdown.js";
import cookieParser from "cookie-parser";


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


import streamRoutes from './routes/routes.js'
app.use('/api/v1/stream', streamRoutes)


export default async function startApp() {
    await connectRedis();

    const server = app.listen(env.PORT, () => {
        console.log(`Auth server running on port ${env.PORT}`);
    });

    const shutdown = createShutdownHandler({
        server,
        logger: console,
        closeResources: [],
    });

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
}
