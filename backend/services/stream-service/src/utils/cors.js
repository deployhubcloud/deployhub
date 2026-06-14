import { env } from "../lib/env.js";

export const corsOption = {
    origin: env.FRONTEND_URI,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}