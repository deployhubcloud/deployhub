import crypto from "crypto";


const IDENTITY_HEADERS = [
  "user-agent",
  "accept",
  "accept-language",
  "accept-encoding",
  "sec-ch-ua",           
  "sec-ch-ua-platform", 
  "sec-ch-ua-mobile",   
  "sec-fetch-dest",
  "sec-fetch-mode",
  "sec-fetch-site",
];

// Headers that hint at automation/bots
const AUTOMATION_SIGNALS = [
  "x-headless-chrome",
  "x-puppeteer",
  "x-playwright",
  "x-automation",
  "x-forwarded-for",   
  "via",              
  "x-real-ip",
];

const SUSPICIOUS_UA_PATTERNS = [
  /python-requests/i,
  /curl\//i,
  /wget\//i,
  /go-http-client/i,
  /java\//i,
  /axios\//i,
  /node-fetch/i,
  /libwww/i,
  /scrapy/i,
  /bot/i,
  /crawler/i,
  /spider/i,
  /headlesschrome/i,
  /phantomjs/i,
  /selenium/i,
];


const DATACENTER_PREFIXES = [
  "10.", "172.16.", "172.17.", "172.18.", "172.19.",
  "172.20.", "172.21.", "172.22.", "172.23.", "172.24.",
  "172.25.", "172.26.", "172.27.", "172.28.", "172.29.",
  "172.30.", "172.31.",
  "157.245.", "167.99.", "104.131.", "165.227.",
  "138.68.", "206.81.", "159.89.",
];


export function buildDeviceFingerprint(req) {
  const headers = req.headers;

  const components = IDENTITY_HEADERS
    .map((h) => `${h}:${headers[h] || ""}`)
    .join("|");

  const hash = crypto
    .createHash("sha256")
    .update(components)
    .digest("hex")
    .slice(0, 16);

  return hash;
}


export function computeSuspicionScore(req) {
  const headers = req.headers;
  const ua = headers["user-agent"] || "";
  let score = 0;
  const reasons = [];

  if (!ua) {
    score += 40;
    reasons.push("no-user-agent");
  }

  for (const pattern of SUSPICIOUS_UA_PATTERNS) {
    if (pattern.test(ua)) {
      score += 30;
      reasons.push(`suspicious-ua:${pattern.source.slice(0, 20)}`);
      break;
    }
  }

  if (!headers["accept"]) {
    score += 15;
    reasons.push("no-accept");
  }
  if (!headers["accept-language"]) {
    score += 15;
    reasons.push("no-accept-language");
  }
  if (!headers["accept-encoding"]) {
    score += 10;
    reasons.push("no-accept-encoding");
  }

  const hasSecCh = headers["sec-ch-ua"] || headers["sec-ch-ua-platform"];
  const claimsModernChrome =
    /Chrome\/[89][0-9]|Chrome\/1[0-9][0-9]/i.test(ua);
  if (claimsModernChrome && !hasSecCh) {
    score += 20;
    reasons.push("fake-chrome-no-sec-ch");
  }

  for (const h of AUTOMATION_SIGNALS) {
    if (headers[h] !== undefined && ["x-headless-chrome", "x-puppeteer", "x-playwright", "x-automation"].includes(h)) {
      score += 35;
      reasons.push(`automation-header:${h}`);
    }
  }

  if (headers["via"]) {
    score += 10;
    reasons.push("via-proxy");
  }

  const ip = getClientIp(req);
  if (ip && isDatacenterIp(ip)) {
    score += 20;
    reasons.push("datacenter-ip");
  }

  return {
    score: Math.min(score, 100),
    reasons,
    ip,
  };
}

export function getClientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const ips = xff.split(",").map((s) => s.trim());
    return ips[ips.length - 1] || req.socket?.remoteAddress || null;
  }

  return req.headers["x-real-ip"] || req.socket?.remoteAddress || null;
}

function isDatacenterIp(ip) {
  return DATACENTER_PREFIXES.some((prefix) => ip.startsWith(prefix));
}
