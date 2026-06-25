import { env } from "../lib/env.js";

export const corsOption = {
    origin: 'dashboard.deployhub.cloud',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}