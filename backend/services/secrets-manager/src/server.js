import './config/env.js';
import app from './index.js';
import { connectRedis } from './config/redis.js';
import { logger } from './config/logger.js';
import { env } from './config/env.js';

async function bootstrap() {
    try {
        await connectRedis();

        const server = app.listen(env.PORT, () => {
            logger.info(`Secrets Manager running`, {
                port: env.PORT,
                env: env.NODE_ENV,
            });
        });

        const shutdown = (signal) => {
            logger.warn(`${signal} received — shutting down`);
            server.close(() => {
                logger.info('Server closed');
                process.exit(0);
            });
            setTimeout(() => process.exit(1), 8000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));

        process.on('unhandledRejection', (reason) => {
            logger.error('Unhandled rejection:', { reason });
            process.exit(1);
        });

    } catch (err) {
        logger.error('Bootstrap failed:', { err: err.message });
        process.exit(1);
    }
}

bootstrap();
