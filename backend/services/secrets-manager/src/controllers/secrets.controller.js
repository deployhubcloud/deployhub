import { getSecretsForService, getRegisteredServices } from '../services/secrets.registry.js';
import { getCachedBundle, setCachedBundle, invalidateBundle, invalidateAll } from '../services/secrets.cache.js';
import { logger } from '../config/logger.js';

export const fetchSecrets = async (req, res) => {
  const { serviceName } = req.params;
  try {
    const cached = await getCachedBundle(serviceName);
    if (cached) {
      logger.debug('Secrets served from cache', { serviceName });
      return res.status(200).json({ success: true, secrets: cached, source: 'cache' });
    }

    const bundle = getSecretsForService(serviceName);
    if (!bundle) {
      logger.warn('Unknown service requested secrets', { serviceName });
      return res.status(404).json({ success: false, message: `Service '${serviceName}' is not registered` });
    }

    await setCachedBundle(serviceName, bundle);
    logger.info('Secrets served from registry', { serviceName, keyCount: Object.keys(bundle).length });
    return res.status(200).json({ success: true, secrets: bundle, source: 'registry' });

  } catch (err) {
    logger.error('Error fetching secrets', { serviceName, err: err.message });
    return res.status(500).json({ success: false, message: 'Failed to fetch secrets' });
  }
};

export const invalidateServiceCache = async (req, res) => {
  const { serviceName } = req.params;
  try {
    const registered = getRegisteredServices();
    if (!registered.includes(serviceName)) {
      return res.status(404).json({ success: false, message: 'Service not registered' });
    }

    await invalidateBundle(serviceName);
    logger.info('Cache invalidated via API', { serviceName });
    return res.status(200).json({ success: true, message: `Cache cleared for ${serviceName}` });

  } catch (err) {
    logger.error('Error invalidating cache', { serviceName, err: err.message });
    return res.status(500).json({ success: false, message: 'Failed to invalidate cache' });
  }
};

export const invalidateAllCaches = async (_req, res) => {
  try {
    await invalidateAll();
    logger.info('All caches invalidated via API');
    return res.status(200).json({ success: true, message: 'All secret caches cleared' });

  } catch (err) {
    logger.error('Error invalidating all caches', { err: err.message });
    return res.status(500).json({ success: false, message: 'Failed to invalidate all caches' });
  }
};