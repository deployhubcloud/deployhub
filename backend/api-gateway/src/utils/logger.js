import pino from "pino";
import { ENV } from "../lib/env.js";

const transport = pino.transport({
    targets: [
        {
            target: 'pino-pretty',
            options: { colorize: true }
        },
    ]
});


export const logger = pino(transport);