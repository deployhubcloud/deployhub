import rateLimit from 'express-rate-limit';
import { logger } from '../config/logger.js';
import { clientIp } from '../../../../shared/utils/clientIp.js';

export const secretsFetchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => clientIp(req),
  handler: (req, res) => {
    logger.warn('Rate limit hit on secrets endpoint', {
      ip: clientIp(req),
      serviceName: req.params.serviceName,
    });
    res.status(429).json({
      success: false,
      message: 'Too many requests. Slow down.',
    });
  },
});
