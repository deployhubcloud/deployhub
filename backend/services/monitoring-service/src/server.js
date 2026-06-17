import { loadSecrets } from "./core/config/secretsloader.js";

// load secrets
await loadSecrets();


// start app
const { default: startApp } = await import("./index.js");
await startApp();

await import('./worker/index.js')