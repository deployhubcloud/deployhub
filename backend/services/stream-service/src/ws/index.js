import { Server } from 'socket.io'
import { setIO } from './io.js'
import { applyAuthMiddleware } from './middleware/wsAuth.js'
import { registerProjectStatusHandler } from './handlers/projectStatusHandler.js'
import { registerLogsStreamHandler } from './handlers/logsStreamHandler.js'

export function initWS(server, corsOrigins) {
    const io = new Server(server, {
        path: '/ws',
        cors: {
            origin: corsOrigins,
            credentials: true
        }
    })

    io.engine.on("connection", (rawSocket) => {
        console.log("Engine connection:", rawSocket.id);
    });

    io.on("connection", (socket) => {
        console.log("Socket connected:", socket.id);
    });

    io.on("connect_error", (err) => {
        console.log("Connect error:", err.message);
    });

    setIO(io)
    applyAuthMiddleware(io)

    registerProjectStatusHandler(io)
    registerLogsStreamHandler(io)

    console.log('WS server initialized')
    return io
}