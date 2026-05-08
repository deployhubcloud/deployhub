import express from 'express';
import { createInternalAUthMiddleware } from '../../shared/middlewares/internalAuth.js';
import { createShutdownHandler } from '../../shared/utils/gracefulShutdown.js';
import { project_env } from './src/lib/env.js';
import { closeDb, connectDb } from './src/core/db/mongodb.js';
import { connectRedis } from './src/core/redis/client.js';
import { closeRabbitMQ, initRabbitMQ } from './src/core/messageBroker/rabbitMq.js';


// express app
const app = express();


// security middleware
import hpp from 'hpp';
import helmet from 'helmet';
app.use(hpp());
app.use(helmet());



// parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// health
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        date: new Date().toLocaleTimeString()
    })
})



// internal Auth
// app.use(createInternalAUthMiddleware({
//     secret: 'fuck',
//     logger: console,
//     header: 'x-internal-secret'
// }));

export default async function startUp(params) {
    const PORT = project_env.PORT;

    await connectDb();
    await connectRedis();
    await initRabbitMQ()

    const server = app.listen(PORT, async () => {
        console.log(`Project-Service is Running on Localhost:${PORT}`)
    });

    const shutDown = createShutdownHandler({
        server,
        logger: console,
        closeResources: [closeDb , closeRabbitMQ]
    })

    process.on('SIGINT', shutDown)
    process.on('SIGTERM', shutDown)

};




