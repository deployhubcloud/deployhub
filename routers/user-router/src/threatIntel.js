const BLOCK_TTL_SECONDS = {
  auto_soft: 5 * 60,      
  auto_hard: 60 * 60,     
  auto_permanent: 24 * 60 * 60,
};

const THRESHOLDS = {
  ip_rpm_warn: Number(process.env.IP_RPM_WARN || 60),
  ip_rpm_block: Number(process.env.IP_RPM_BLOCK || 200),
  device_rpm_warn: Number(process.env.DEVICE_RPM_WARN || 80),
  device_rpm_block: Number(process.env.DEVICE_RPM_BLOCK || 250),
  project_scan_warn: Number(process.env.PROJECT_SCAN_WARN || 5),
  project_scan_block: Number(process.env.PROJECT_SCAN_BLOCK || 10),
  suspicion_block: Number(process.env.SUSPICION_BLOCK || 70),
  error_rate_block: Number(process.env.ERROR_RATE_BLOCK || 0.7),
};

export function createThreatIntelligence({ redisclient }) {
  async function isBlocked(ip, deviceId) {
    const [ipBlocked, deviceBlocked] = await Promise.all([
      ip ? redisclient.get(`blocked:ip:${ip}`) : null,
      deviceId ? redisclient.get(`blocked:device:${deviceId}`) : null,
    ]);

    if (ipBlocked) return { blocked: true, reason: `ip:${ipBlocked}`, type: "ip" };
    if (deviceBlocked) return { blocked: true, reason: `device:${deviceBlocked}`, type: "device" };
    return { blocked: false };
  }

  async function blockIp(ip, reason, severity = "auto_soft") {
    const ttl = BLOCK_TTL_SECONDS[severity] || BLOCK_TTL_SECONDS.auto_soft;
    await redisclient.set(`blocked:ip:${ip}`, reason, "EX", ttl);
    console.warn(`[ThreatIntel] Blocked IP ${ip} for ${ttl}s — reason: ${reason}`);
  }

  async function blockDevice(deviceId, reason, severity = "auto_soft") {
    const ttl = BLOCK_TTL_SECONDS[severity] || BLOCK_TTL_SECONDS.auto_soft;
    await redisclient.set(`blocked:device:${deviceId}`, reason, "EX", ttl);
    console.warn(`[ThreatIntel] Blocked device ${deviceId} for ${ttl}s — reason: ${reason}`);
  }


  async function incrCounter(key, windowSec) {
    const pipe = redisclient.pipeline();
    pipe.incr(key);
    pipe.expire(key, windowSec, "NX");
    const results = await pipe.exec();
    return results[0][1];
  }


  async function trackAndAnalyze(ip, deviceId, projectId) {
    const minute = Math.floor(Date.now() / 60_000); 
    const hour = Math.floor(Date.now() / 3_600_000);

    const keys = {
      ipRpm: ip ? `intel:ip:rpm:${ip}:${minute}` : null,
      ipRph: ip ? `intel:ip:rph:${ip}:${hour}` : null,
      deviceRpm: deviceId ? `intel:dev:rpm:${deviceId}:${minute}` : null,
      ipProjects: ip ? `intel:ip:projects:${ip}:${minute}` : null,
      deviceProjects: deviceId ? `intel:dev:projects:${deviceId}:${minute}` : null,
    };

    const pipe = redisclient.pipeline();

    if (keys.ipRpm) { pipe.incr(keys.ipRpm); pipe.expire(keys.ipRpm, 90, "NX"); }
    if (keys.ipRph) { pipe.incr(keys.ipRph); pipe.expire(keys.ipRph, 7200, "NX"); }
    if (keys.deviceRpm) { pipe.incr(keys.deviceRpm); pipe.expire(keys.deviceRpm, 90, "NX"); }

    if (projectId) {
      if (keys.ipProjects) { pipe.pfadd(keys.ipProjects, projectId); pipe.expire(keys.ipProjects, 90, "NX"); }
      if (keys.deviceProjects) { pipe.pfadd(keys.deviceProjects, projectId); pipe.expire(keys.deviceProjects, 90, "NX"); }
    }

    const results = await pipe.exec();

    let idx = 0;
    const ipRpm = keys.ipRpm ? results[idx++][1] : 0; if (keys.ipRpm) idx++; // skip expire
    const ipRph = keys.ipRph ? results[idx++][1] : 0; if (keys.ipRph) idx++;
    const deviceRpm = keys.deviceRpm ? results[idx++][1] : 0; if (keys.deviceRpm) idx++;

    let ipProjects = 0, deviceProjects = 0;
    if (projectId) {
      const counts = await Promise.all([
        keys.ipProjects ? redisclient.pfcount(keys.ipProjects) : 0,
        keys.deviceProjects ? redisclient.pfcount(keys.deviceProjects) : 0,
      ]);
      ipProjects = counts[0];
      deviceProjects = counts[1];
    }

    return {
      ipRpm: Number(ipRpm) || 0,
      ipRph: Number(ipRph) || 0,
      deviceRpm: Number(deviceRpm) || 0,
      ipProjectsScan: ipProjects,
      deviceProjectsScan: deviceProjects,
    };
  }

  async function trackOffense(key) {
    const offenseKey = `offense:${key}`;
    const pipe = redisclient.pipeline();
    pipe.incr(offenseKey);
    pipe.expire(offenseKey, 24 * 60 * 60); 
    const results = await pipe.exec();
    return results[0][1];
  }


  async function analyze({ ip, deviceId, projectId, suspicionScore, suspicionReasons }) {
    const blockStatus = await isBlocked(ip, deviceId);
    if (blockStatus.blocked) {
      return {
        shouldBlock: true,
        blockType: blockStatus.type,
        reason: `already-blocked:${blockStatus.reason}`,
        severity: "existing",
        stats: {},
      };
    }

    if (suspicionScore >= THRESHOLDS.suspicion_block) {
      const offenses = await trackOffense(`device:${deviceId}`);
      const severity = offenses >= 3 ? "auto_hard" : "auto_soft";
      await blockDevice(deviceId, `bot-score-${suspicionScore}`, severity);
      if (ip) await blockIp(ip, `bot-score-${suspicionScore}`, severity);

      return {
        shouldBlock: true,
        blockType: "bot",
        reason: `bot-detected:${suspicionReasons.join(",")}`,
        severity,
        stats: { suspicionScore },
      };
    }

    const stats = await trackAndAnalyze(ip, deviceId, projectId);

    if (stats.ipRpm >= THRESHOLDS.ip_rpm_block) {
      const offenses = await trackOffense(`ip:${ip}`);
      const severity = offenses >= 3 ? "auto_hard" : "auto_soft";
      if (ip) await blockIp(ip, `rpm-exceeded:${stats.ipRpm}`, severity);
      return { shouldBlock: true, blockType: "ip-rpm", reason: `ip-rpm:${stats.ipRpm}`, severity, stats };
    }

    if (stats.deviceRpm >= THRESHOLDS.device_rpm_block) {
      const offenses = await trackOffense(`device:${deviceId}`);
      const severity = offenses >= 2 ? "auto_hard" : "auto_soft";
      await blockDevice(deviceId, `device-rpm:${stats.deviceRpm}`, severity);
      return { shouldBlock: true, blockType: "device-rpm", reason: `device-rpm:${stats.deviceRpm}`, severity, stats };
    }

    if (stats.ipProjectsScan >= THRESHOLDS.project_scan_block) {
      const offenses = await trackOffense(`ip:${ip}`);
      const severity = offenses >= 2 ? "auto_permanent" : "auto_hard";
      if (ip) await blockIp(ip, `scanner:${stats.ipProjectsScan}-projects`, severity);
      return { shouldBlock: true, blockType: "scanner", reason: `scanning:${stats.ipProjectsScan}`, severity, stats };
    }

    if (stats.deviceProjectsScan >= THRESHOLDS.project_scan_block) {
      await blockDevice(deviceId, `scanner:${stats.deviceProjectsScan}-projects`, "auto_hard");
      return { shouldBlock: true, blockType: "device-scanner", reason: `device-scanning:${stats.deviceProjectsScan}`, severity: "auto_hard", stats };
    }

    return { shouldBlock: false, stats };
  }

  async function manualBlock(ip, reason, ttlSeconds = 86400) {
    await redisclient.set(`blocked:ip:${ip}`, `manual:${reason}`, "EX", ttlSeconds);
  }

  async function unblock(ip) {
    await redisclient.del(`blocked:ip:${ip}`);
  }

  async function getBlockedList() {
    const keys = await redisclient.keys("blocked:ip:*");
    if (!keys.length) return [];

    const pipe = redisclient.pipeline();
    keys.forEach((k) => pipe.get(k));
    const results = await pipe.exec();

    return keys.map((k, i) => ({
      ip: k.replace("blocked:ip:", ""),
      reason: results[i][1],
    }));
  }

  return {
    analyze,
    isBlocked,
    blockIp,
    blockDevice,
    manualBlock,
    unblock,
    getBlockedList,
    thresholds: THRESHOLDS,
  };
}
