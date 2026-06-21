import dotenv from "dotenv";

dotenv.config();

const DEFAULT_PLATFORM_ROUTES = {
  "deployhub.cloud": "http://deployhub:80",
  "www.deployhub.cloud": "http://deployhub:80",
  "api.deployhub.cloud": "http://deployhubapigateway:4999",
  "cloudcoderhub.in": "http://cloucoderhub:80",
  "www.cloudcoderhub.in": "http://cloucoderhub:80",
  "console.cloudcoderhub.in": "http://minio:9000",
  "storage.cloudcoderhub.in": "http://minio:9001",
  "devload.cloudcoderhub.in": "http://devload:80",
  "app-devload.cloudcoderhub.in": "http://appdevload:80",
  "api-devload.cloudcoderhub.in": "http://apidevload:6700",
  "dashboard.deployhub.cloud": "http://appdeployhub:80",
};

function loadExtraRoutes() {
  if (!process.env.PLATFORM_ROUTES_JSON) return {};

  try {
    return JSON.parse(process.env.PLATFORM_ROUTES_JSON);
  } catch (err) {
    console.error("[PlatformRouter] Invalid PLATFORM_ROUTES_JSON:", err.message);
    return {};
  }
}

const platformRoutes = {
  ...DEFAULT_PLATFORM_ROUTES,
  ...loadExtraRoutes(),
};

export function getPlatformRoute(host) {
  const target = platformRoutes[host];
  if (!target) return null;

  return {
    host,
    target,
  };
}
