import jwt from 'jsonwebtoken'
import { env } from '../../lib/env.js'
import { getRedis } from '../../core/redis/client.js'

function parseCookies(cookieHeader = '') {
    return Object.fromEntries(
        cookieHeader.split(';')
            .map(c => c.trim().split('='))
            .filter(([k]) => k)
            .map(([k, ...v]) => [k.trim(), v.join('=')])
    )
}

export function applyAuthMiddleware(io) {
    io.use(async (socket, next) => {
        try {
            const cookies = parseCookies(socket.handshake.headers.cookie)
            const token = cookies['AccessToken']

            if (!token) return next(new Error('Unauthorized'))

            let decoded
            try {
                decoded = jwt.verify(token, env.ACCESS_TOKEN_SECRET)
            } catch {
                return next(new Error('Invalid token'))
            }

            const { _id: userId, tokenId } = decoded
            if (!userId || !tokenId) return next(new Error('Invalid payload'))

            const redis = getRedis()
            const sessionData = await redis.get(`deployhub:session:${userId}:${tokenId}`)
            if (!sessionData) return next(new Error('Session expired'))

            socket.user = { _id: userId, tokenId }
            next()

        } catch {
            next(new Error('Auth error'))
        }
    })
}