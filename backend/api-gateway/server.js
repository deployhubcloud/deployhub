import { loadSecrets } from "../services/identity-service/src/core/config/secretsloader.js";


// load secrets
await loadSecrets();


// start app
const { default: startApp } = await import("./index.js");
await startApp();