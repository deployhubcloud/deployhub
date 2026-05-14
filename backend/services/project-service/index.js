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
    console.log(req.user)
    res.status(200).json({
        success: true,
        date: new Date().toLocaleTimeString()
    })
})


//internal Auth
app.use(createInternalAUthMiddleware({
    secret: project_env.INTERNAL_SERVICE_SECRET,
    logger: console,
    header: 'x-internal-secret'
}));


import userContext from '../../shared/middlewares/userContext.js';
app.use(userContext);


// routes
import projectRouter from './src/routes/router.js';
app.use('/', projectRouter);



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
        closeResources: [closeDb, closeRabbitMQ]
    })

    process.on('SIGINT', shutDown)
    process.on('SIGTERM', shutDown)

};




