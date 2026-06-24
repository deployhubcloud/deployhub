import { buildDeviceFingerprint, computeSuspicionScore, getClientIp } from "./fingerprint.js";


const BYPASS_PATHS = new Set(["/routerhealth", "/favicon.ico"]);


const LOG_SAMPLE_RATE = Number(process.env.SECURITY_LOG_SAMPLE || 1);

export function createSecurityMiddleware({ threatIntel }) {
  return async function securityMiddleware(req, res, next) {
    if (BYPASS_PATHS.has(req.path)) return next();

    const ip = getClientIp(req);
    const deviceId = buildDeviceFingerprint(req);
    const { score: suspicionScore, reasons: suspicionReasons } = computeSuspicionScore(req);

    req.security = { ip, deviceId, suspicionScore, suspicionReasons };

    try {
      const result = await threatIntel.analyze({
        ip,
        deviceId,
        projectId: null,
        suspicionScore,
        suspicionReasons,
      });

      if (result.shouldBlock) {
        if (Math.random() < LOG_SAMPLE_RATE) {
          console.warn(
            `[Security] BLOCKED ${ip} device:${deviceId} — ${result.reason} ` +
            `(severity: ${result.severity}, score: ${suspicionScore})`
          );
        }

        const isBotBlock = ["bot", "scanner", "device-scanner"].includes(result.blockType);
        const status = isBotBlock ? 403 : 429;

        res.setHeader("X-Block-Reason", result.blockType);
        if (status === 429 && result.stats?.retryAfter) {
          res.setHeader("Retry-After", result.stats.retryAfter);
        }

        return res.status(status).send(getBlockMessage(result.blockType));
      }

      if (suspicionScore >= 40) {
        res.setHeader("X-Security-Score", suspicionScore);
      }

      next();
    } catch (err) {
      console.error("[Security] Middleware error (failing open):", err.message);
      next();
    }
  };
}


export async function runProjectLevelAnalysis({ threatIntel, req, projectId }) {
  if (!req.security) return { shouldBlock: false };

  const { ip, deviceId, suspicionScore, suspicionReasons } = req.security;

  return threatIntel.analyze({
    ip,
    deviceId,
    projectId,
    suspicionScore,
    suspicionReasons,
  });
}

function getBlockMessage(blockType) {
  switch (blockType) {
    case "bot":
    case "device-scanner":
      return "Access denied";
    case "scanner":
      return "Access denied";
    case "ip-rpm":
    case "device-rpm":
      return "Too many requests, please slow down";
    case "existing":
      return "Access denied";
    default:
      return "Request blocked";
  }
}
