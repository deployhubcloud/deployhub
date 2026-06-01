import { loadSecret } from "./src/config/secretLoader.js";

await loadSecret()

const { project_env } = await import("./src/lib/env.js");

const { default: startup } = await import("./index.js");
await startup(project_env.PORT)