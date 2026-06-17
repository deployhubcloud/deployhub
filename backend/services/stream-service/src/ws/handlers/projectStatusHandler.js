import { getRedis } from '../../core/redis/client.js'
import { getIO } from '../io.js'


let subscriber = null

export function registerProjectStatusHandler(io) {
    io.on('connection', (socket) => {
        socket.on('subscribe_projects', async (projectIds) => {
            if (!Array.isArray(projectIds)) return

            const prevRooms = [...socket.rooms].filter(r => r.startsWith('project:status:'))
            prevRooms.forEach(r => socket.leave(r))

            projectIds.forEach(id => socket.join(`project:status:${id}`))

            const redis = getRedis()
            for (const projectId of projectIds) {
                try {
                    const entries = await redis.xrevrange(
                        `deployhub:users:projects:status:${projectId}`, '+', '-', 'COUNT', 1
                    )
                    if (entries?.length > 0) {
                        const [, fields] = entries[0]
                        const payload = {}
                        for (let i = 0; i < fields.length; i += 2) {
                            payload[fields[i]] = fields[i + 1]
                        }
                        socket.emit('project_status', {
                            projectId,
                            status: payload.status
                        })
                    }
                } catch { }
            }
        })
    })

    startRedisSubscriber()
}

async function startRedisSubscriber() {
    const redis = getRedis()

    subscriber = redis.duplicate()

    await subscriber.subscribe('deployhub:users:projects:status:updates')

    subscriber.on('message', (channel, message) => {
        if (channel !== 'deployhub:users:projects:status:updates') return
        try {
            const { projectId, status } = JSON.parse(message)
            const io = getIO()
            if (!io) return
            io.to(`project:status:${projectId}`).emit('project_status', { projectId, status })
        } catch { }
    })
}