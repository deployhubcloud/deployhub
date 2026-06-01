import winston from 'winston';
import { AUTH_ENV } from '../../lib/env.js';

const { combine, timestamp, json, colorize, printf } = winston.format;

const devFormat = combine(
    colorize({ all: true }),
    timestamp({ format: 'HH:mm:ss' }),
    printf(({ level, message, timestamp, ...meta }) => {
        const extras = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} [${AUTH_ENV.SERVICE_NAME}] [${level}] ${message} ${extras}`;
    })
);

const prodFormat = combine(timestamp(), json());

export const logger = winston.createLogger({
    level: AUTH_ENV.NODE_ENV === 'production' ? 'info' : 'debug',
    defaultMeta: { service: AUTH_ENV.SERVICE_NAME },
    format: AUTH_ENV.NODE_ENV === 'production' ? prodFormat : devFormat,
    transports: [new winston.transports.Console()],
});