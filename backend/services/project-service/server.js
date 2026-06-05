import { loadSecret } from "./src/config/secretLoader.js";

await loadSecret()

const { project_env } = await import("./src/lib/env.js");


const { default: startup } = await import("./index.js");
await startup(project_env.PORT)

await import('./src/workers/projectStatus.js')

const { Port } = await import("./src/models/port.model.js")
const { cachePortWhenServerStart } = await import("./src/utils/cachePortWhenServerStart.js")
await cachePortWhenServerStart(Port)