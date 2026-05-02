import rateLimit from 'express-rate-limit';
import { logger } from '../config/logger.js';

export const secretsFetchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit hit on secrets endpoint', {
      ip: req.ip,
      serviceName: req.params.serviceName,
    });
    res.status(429).json({
      success: false,
      message: 'Too many requests. Slow down.',
    });
  },
});
