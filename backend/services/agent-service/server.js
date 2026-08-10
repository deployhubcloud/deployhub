import { loadSecrets } from './src/core/config/secretsloader.js';

await loadSecrets();

const { agentEnv } = await import('./src/lib/env.js');
const { default: startApp } = await import('./index.js');
await startApp(agentEnv.PORT, agentEnv.SERVICE_NAME);
