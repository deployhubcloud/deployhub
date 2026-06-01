import { loadSecrets } from "./core/config/secretsloader.js";

// load secrets
await loadSecrets();

const { AUTH_ENV } = await import("./lib/env.js")

// start app
const { default: startApp } = await import("./index.js");
await startApp(AUTH_ENV.PORT, AUTH_ENV.SERVICE_NAME);