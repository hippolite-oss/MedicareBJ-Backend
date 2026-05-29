/**
 * utils/generateToken.js — Helpers JWT
 */
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Génère un access token (15 min)
 */
function generateAccessToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, statut: user.statut },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

/**
 * Génère un refresh token (7 jours)
 */
function generateRefreshToken(user) {
  return jwt.sign(
    { id: user.id, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

/**
 * Vérifie un access token
 */
function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

/**
 * Vérifie un refresh token
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
}

/**
 * Génère un token de réinitialisation de mot de passe (crypto)
 */
function generateResetToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 heure
  return { token, hash, expires };
}

/**
 * Hash un token reset pour comparaison
 */
function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateResetToken,
  hashResetToken,
};
