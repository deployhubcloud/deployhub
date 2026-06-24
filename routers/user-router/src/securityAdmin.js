import { Router } from "express";
import { getClientIp } from "./fingerprint.js";

export function createSecurityAdminRouter({ threatIntel, redisclient }) {
  const router = Router();

  const ADMIN_KEY = process.env.SECURITY_ADMIN_KEY;

  router.use((req, res, next) => {
    if (!ADMIN_KEY) {
      return res.status(404).send("Not found");
    }

    const provided = req.headers["x-admin-key"] || req.query.key;
    if (provided !== ADMIN_KEY) {
      return res.status(401).send("Unauthorized");
    }

    next();
  });

  router.get("/blocked", async (req, res) => {
    try {
      const list = await threatIntel.getBlockedList();
      res.json({ count: list.length, blocked: list });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });


  router.post("/block", async (req, res) => {
    const { ip, reason = "manual", ttl = 86400 } = req.body;
    if (!ip) return res.status(400).json({ error: "ip required" });

    try {
      await threatIntel.manualBlock(ip, reason, ttl);
      res.json({ ok: true, ip, ttl });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.delete("/block/:ip", async (req, res) => {
    try {
      await threatIntel.unblock(req.params.ip);
      res.json({ ok: true, ip: req.params.ip });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/stats/:ip", async (req, res) => {
    const ip = req.params.ip;
    const minute = Math.floor(Date.now() / 60_000);
    const hour = Math.floor(Date.now() / 3_600_000);

    try {
      const [rpm, rph, offenses] = await Promise.all([
        redisclient.get(`intel:ip:rpm:${ip}:${minute}`),
        redisclient.get(`intel:ip:rph:${ip}:${hour}`),
        redisclient.get(`offense:ip:${ip}`),
      ]);

      res.json({
        ip,
        rpm: Number(rpm) || 0,
        rph: Number(rph) || 0,
        offenses: Number(offenses) || 0,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get("/thresholds", (req, res) => {
    res.json(threatIntel.thresholds);
  });

  return router;
}
