import { Server } from 'socket.io'
import { setIO } from './io.js'
import { applyAuthMiddleware } from './middleware/wsAuth.js'
import { registerProjectStatusHandler } from './handlers/projectStatusHandler.js'

export function initWS(server, corsOrigins) {
    const io = new Server(server, {
        path: '/ws',
        cors: {
            origin: corsOrigins,
            credentials: true
        }
    })

    setIO(io)
    applyAuthMiddleware(io)

    registerProjectStatusHandler(io)

    console.log('WS server initialized')
    return io
}