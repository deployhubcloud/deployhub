import { loadSecret } from "./src/config/secretLoader.js";

await loadSecret()


const { default: startup } = await import("./index.js");
await startup()