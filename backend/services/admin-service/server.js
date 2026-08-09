import { loadSecrets } from './src/core/config/secretsloader.js';

await loadSecrets();

const { adminEnv } = await import('./src/lib/env.js');
const { default: startApp } = await import('./index.js');
await startApp(adminEnv.PORT, adminEnv.SERVICE_NAME);
