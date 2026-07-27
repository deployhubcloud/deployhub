import { createRequire } from 'module'
import { buildEnv } from '../../lib/env.js'


const require = createRequire(import.meta.url)
const Minio = require('minio')

const BUCKET = buildEnv.MINIO_BUCKET;


const client = new Minio.Client({
  endPoint: buildEnv.NODE_ENV === "production" ? 'storage.cloudcoderhub.in' : "localhost",
  port: DEPLOY_SERVICE_ENV.NODE_ENV === "production" ? 443 : 9000,
  useSSL: DEPLOY_SERVICE_ENV.NODE_ENV === "production",
  region: "auto",
  accessKey: buildEnv.NODE_ENV === "production" ? buildEnv.MINIO_ACCESS_KEY : "admin",
  secretKey: buildEnv.NODE_ENV === "production" ? buildEnv.MINIO_SECRET_KEY : "rahul@dkfd48"
})

export async function ensureBucket() {
  const exists = await client.bucketExists(BUCKET)
  if (!exists) {
    await client.makeBucket(BUCKET)
    console.log(`[minio] bucket "${BUCKET}" created`)
  }

  try {
    const policy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: '*',
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${BUCKET}/*`],
      }],
    })
    await client.setBucketPolicy(BUCKET, policy)
    console.log(`[minio] public read policy applied`)
  } catch (err) {
    console.error('[minio] policy error (non-fatal):', err.message)
  }
}

export async function uploadLog(objectName, content) {
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf-8')
  await client.putObject(BUCKET, objectName, buf, buf.length, {
    'Content-Type': 'text/plain; charset=utf-8',
  })
}

export async function uplaodStatisBuildZipFile(objectName, content) {
  const buf = Buffer.isBuffer(content) ? content : Buffer.from(content, 'binary')
  await client.putObject(BUCKET, objectName, buf, buf.length, {
    'Content-Type': 'application/zip'
  })
}


export function buildLogUrl(objectName) {
  const publicHost = buildEnv.NODE_ENV === "production" ? buildEnv.MINIO_PUBLIC_HOST : "localhost:9000"
  return ` ${buildEnv.NODE_ENV === "production" ? "https" : "http"}://${publicHost}/${BUCKET}/${objectName}`
}

export function buildZipUrl(objectName) {
  const publicHost = buildEnv.NODE_ENV === "production" ? buildEnv.MINIO_PUBLIC_HOST : "localhost:9000"
  return ` ${buildEnv.NODE_ENV === "production" ? "https" : "http"}://${publicHost}/${BUCKET}/${objectName}`
}

export default client