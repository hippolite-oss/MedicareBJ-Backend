/**
 * middlewares/rateLimit.middleware.js — Rate limiting
 */
const rateLimit = require('express-rate-limit');
const { tooManyRequests } = require('../utils/apiResponse');

const handler = (req, res) => tooManyRequests(res, 'Trop de requêtes. Réessayez plus tard.');

// Rate limit global : 200 req / 15 min par IP (augmenté pour le polling)
const globalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 200, // Augmenté de 100 à 200
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Rate limit auth : 5 tentatives / 15 min (anti-brute force)
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skipSuccessfulRequests: true,
});

// Rate limit API : 300 req / 15 min par token
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// Rate limit pour les endpoints de comptage (notifications, messages)
// Plus permissif car utilisé pour le polling
const countRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requêtes (permet le polling fréquent)
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skipFailedRequests: true, // Ne pas compter les requêtes échouées
});

module.exports = { globalRateLimit, authRateLimit, apiRateLimit, countRateLimit };
