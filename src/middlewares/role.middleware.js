/**
 * middlewares/role.middleware.js — Contrôle des rôles
 */
const { forbidden } = require('../utils/apiResponse');

/**
 * Vérifie que l'utilisateur possède l'un des rôles autorisés
 * @param {...string} roles - Rôles autorisés
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return forbidden(res, 'Non authentifié');
    if (!roles.includes(req.user.role)) {
      return forbidden(res, `Accès réservé aux rôles : ${roles.join(', ')}`);
    }
    next();
  };
}

module.exports = { requireRole };
