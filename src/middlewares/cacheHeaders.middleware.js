/**
 * Middleware pour ajouter des headers Cache-Control sur les réponses GET
 * Permet aux clients (navigateur, React Native) de mettre en cache les réponses
 */

/**
 * Cache court (30s) — pour les données qui changent fréquemment
 */
const cacheShort = (req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
  }
  next();
};

/**
 * Cache moyen (2min) — pour les listes
 */
const cacheMedium = (req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'private, max-age=120, stale-while-revalidate=300');
  }
  next();
};

/**
 * Cache long (10min) — pour les données statiques (profil, QR code)
 */
const cacheLong = (req, res, next) => {
  if (req.method === 'GET') {
    res.setHeader('Cache-Control', 'private, max-age=600, stale-while-revalidate=1200');
  }
  next();
};

/**
 * Pas de cache — pour les données temps réel (compteurs)
 */
const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  next();
};

module.exports = { cacheShort, cacheMedium, cacheLong, noCache };
