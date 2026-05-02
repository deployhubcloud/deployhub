import { loadSecrets } from "./src/configs/secretsloader.js";


// load secrets
await loadSecrets();


// start app
const { default: startApp } = await import("./index.js");
await startApp();
