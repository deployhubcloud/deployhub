import { loadSecrets } from "./core/config/secretsloader.js";

// load secrets
await loadSecrets();

const { NOTIFICATION_ENV } = await import("./lib/env.js")


// start app
const { default: startApp } = await import("./index.js");
await startApp(NOTIFICATION_ENV.PORT, NOTIFICATION_ENV.SERVICE_NAME);

// run workers after service dependencies are connected
await import("./workers/welcomeWorker.js");
await import("./workers/projectStatus.worker.js");
