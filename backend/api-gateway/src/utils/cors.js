import { ENV } from "../lib/env.js";

export const corsOption = {
    origin: ENV.FRONTEND_URI,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization']
}