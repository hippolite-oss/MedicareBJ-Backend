/**
 * middlewares/rateLimit.middleware.js — Rate limiting intelligent
 * Limites augmentées pour les clients mobiles avec React Query
 */
const rateLimit = require("express-rate-limit");
const { tooManyRequests } = require("../utils/apiResponse");

const handler = (req, res) => {
  const retryAfter =
    Math.ceil((req.rateLimit?.resetTime - Date.now()) / 1000) || 60;
  res.setHeader("Retry-After", retryAfter);
  tooManyRequests(
    res,
    `Trop de requêtes. Réessayez dans ${retryAfter} secondes.`,
  );
};

// ── Rate limit global : 500 req / 15 min par IP ───────────────────────────────
// React Query + Socket.IO peuvent générer ~20-30 req/min légitimes par session
const globalRateLimit = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 500,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skip: (req) => {
    // Ne pas rate-limiter les health checks
    return req.path === "/health";
  },
});

// ── Rate limit auth : 10 tentatives / 15 min (anti-brute force) ─────────────
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skipSuccessfulRequests: true, // Compter seulement les échecs
});

// ── Rate limit API par token : 600 req / 15 min ──────────────────────────────
// ~40 req/min pour un utilisateur actif : conversations, notifications, données
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// ── Rate limit compteurs (notifications + messages) ──────────────────────────
// Ces endpoints sont appelés peu fréquemment grâce au socket (mise à jour push)
// Mais on laisse une marge confortable
const countRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // Réduit car le socket gère les updates en push
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skipFailedRequests: true,
});

// ── Rate limit upload : 20 uploads / 15 min ──────────────────────────────────
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

module.exports = {
  globalRateLimit,
  authRateLimit,
  apiRateLimit,
  countRateLimit,
  uploadRateLimit,
};
