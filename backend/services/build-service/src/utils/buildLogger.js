import { uploadLog, buildLogUrl } from '../utils/minio/minio.js'
import { Build } from '../models/build.model.js'
import { getRedis } from '../core/redis/client.js'

const redis = getRedis()

export class BuildLogger {
    constructor(buildId, projectId) {
        this.buildId = buildId
        this.projectId = projectId
        this.lines = []
        this.startedAt = null

        this.streamKey = `build:logs:${buildId}`
    }

    async start() {
        this.startedAt = new Date()

        await this.write(
            `[deployhub] Build started at ${this.startedAt.toISOString()}`
        )

        await Build.findByIdAndUpdate(this.buildId, {
            $set: {
                status: 'pending',
                startedAt: this.startedAt,
            },
        })
    }

    async write(chunk) {
        if (!chunk) return

        const clean = chunk
            .toString()
            .replace(/\r/g, '')
            .replace(/^[\x00-\x08][\x00-\x03][\x00]{6}/gm, '')
            .trimEnd()

        if (!clean) return

        const ignorePatterns = [
            /^Step \d+\//,
            /^ ---> /,
            /^Successfully built/,
            /^Successfully tagged/,
            /^Removing intermediate container/,
            /^npm notice/,
            /^npm fund/,
            /^\s*$/
        ]

        const shouldIgnore = ignorePatterns.some(
            pattern => pattern.test(clean)
        )

        if (shouldIgnore) {
            return
        }

        const ts = new Date().toISOString().slice(11, 23)
        const line = `[${ts}] ${clean}`

        this.lines.push(line)

        await redis.xadd(
            this.streamKey,
            '*',
            'projectId',
            String(this.projectId),
            'buildId',
            String(this.buildId),
            'log',
            line,
            'createdAt',
            String(Date.now())
        )

        await redis.expire(
            this.streamKey,
            60 * 60 * 24
        )
    }

    async finish(status = 'success') {
        const finishedAt = new Date()

        await this.write(
            `[deployhub] Build ${status} at ${finishedAt.toISOString()}`
        )

        const objectName =
            `buildsLogsUrl/${this.projectId}/${this.buildId}.log`

        let logUrl = null

        try {
            await uploadLog(
                objectName,
                this.lines.join('\n')
            )

            logUrl = buildLogUrl(objectName)
        } catch (err) {
            console.error(
                '[buildLogger] Minio upload failed:',
                err.message
            )
        }

        await redis.xadd(
            this.streamKey,
            '*',
            'type',
            'complete',
            'status',
            status,
            'logUrl',
            logUrl || '',
            'createdAt',
            String(Date.now())
        )

        await Build.findByIdAndUpdate(
            this.buildId,
            {
                $set: {
                    status,
                    finishedAt,
                    logUrl,
                },
            }
        )

        return logUrl
    }
}