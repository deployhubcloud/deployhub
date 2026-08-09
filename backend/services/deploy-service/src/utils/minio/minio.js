import { createRequire } from 'module'
import { DEPLOY_SERVICE_ENV } from '../../lib/env.js'


const require = createRequire(import.meta.url)
const Minio = require('minio')

const BUCKET = DEPLOY_SERVICE_ENV.MINIO_BUCKET;


const client = new Minio.Client({
  endPoint: DEPLOY_SERVICE_ENV.NODE_ENV === "production" ? 'storage.cloudcoderhub.in' : "localhost",
  port: DEPLOY_SERVICE_ENV.NODE_ENV === "production" ? 443 : 9000,
  useSSL: DEPLOY_SERVICE_ENV.NODE_ENV === "production",
  region: "auto",
  accessKey: DEPLOY_SERVICE_ENV.NODE_ENV === "production" ? DEPLOY_SERVICE_ENV.MINIO_ACCESS_KEY : "admin",
  secretKey: DEPLOY_SERVICE_ENV.NODE_ENV === "production" ? DEPLOY_SERVICE_ENV.MINIO_SECRET_KEY : "rahul@dkfd48"
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

export function buildZipUrl(objectName) {
  const publicHost = DEPLOY_SERVICE_ENV.NODE_ENV === "production" ? DEPLOY_SERVICE_ENV.MINIO_PUBLIC_HOST : "localhost:9000"
  return `${DEPLOY_SERVICE_ENV.NODE_ENV === "production" ? "https" : "http"}://${publicHost}/${BUCKET}/${objectName}`
}

export async function deleteObjectsByPrefix(prefix) {
  const normalizedPrefix = prefix.endsWith('/') ? prefix : `${prefix}/`;
  const objectsToDelete = [];

  const stream = client.listObjectsV2(
    BUCKET,
    normalizedPrefix,
    true
  );

  return new Promise((resolve, reject) => {
    stream.on("data", (obj) => {
      if (obj?.name) objectsToDelete.push(obj.name);
    });

    stream.on("error", reject);

    stream.on("end", async () => {
      if (objectsToDelete.length === 0) {
        return resolve(0);
      }

      try {
        await client.removeObjects(
          BUCKET,
          objectsToDelete
        );

        console.log(
          `[minio] Deleted ${objectsToDelete.length} objects under ${normalizedPrefix}`
        );

        resolve(objectsToDelete.length);
      } catch (error) {
        reject(error);
      }
    });
  });
}

/** @deprecated Prefer deleteObjectsByPrefix */
export async function deleteProjectLogs(prefixOrProjectId) {
  const prefix = String(prefixOrProjectId).includes('/')
    ? prefixOrProjectId
    : `buildsLogsUrl/${prefixOrProjectId}`;
  return deleteObjectsByPrefix(prefix);
}

export default client
