/**
 * services/cache.service.js — Redis cache helpers
 */
const { getRedis } = require('../config/redis');
const logger = require('../utils/logger');

const cacheService = {
  async get(key) {
    try {
      const redis = getRedis();
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.warn('Cache get erreur :', err.message);
      return null;
    }
  },

  async set(key, value, ttlSeconds = 300) {
    try {
      const redis = getRedis();
      await redis.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (err) {
      logger.warn('Cache set erreur :', err.message);
    }
  },

  async del(pattern) {
    try {
      const redis = getRedis();
      
      // Si le pattern contient un wildcard (*), utiliser KEYS + DEL
      if (pattern.includes('*')) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(keys);
          logger.info(`Cache: ${keys.length} clé(s) supprimée(s) pour le pattern "${pattern}"`);
        }
      } else {
        // Sinon, suppression simple d'une clé exacte
        await redis.del(pattern);
      }
    } catch (err) {
      logger.warn('Cache del erreur :', err.message);
    }
  },

  async incr(key, ttlSeconds = 60) {
    try {
      const redis = getRedis();
      const val = await redis.incr(key);
      if (val === 1) await redis.expire(key, ttlSeconds);
      return val;
    } catch (err) {
      logger.warn('Cache incr erreur :', err.message);
      return 0;
    }
  },

  async decr(key) {
    try {
      const redis = getRedis();
      const val = await redis.decr(key);
      return Math.max(0, val);
    } catch (err) {
      logger.warn('Cache decr erreur :', err.message);
      return 0;
    }
  },
};

module.exports = { cacheService };
