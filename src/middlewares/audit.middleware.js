/**
 * middlewares/audit.middleware.js — Log automatique des actions sensibles
 */
const { auditService } = require('../services/audit.service');

/**
 * Middleware qui log automatiquement une action dans le journal d'audit
 * @param {string} action - Code de l'action (ex: ACCES_DOSSIER)
 * @param {Function} getDetails - Fonction qui retourne les détails depuis req
 */
function auditLog(action, getDetails = null) {
  return async (req, res, next) => {
    // On log après la réponse pour ne pas bloquer
    const originalJson = res.json.bind(res);
    res.json = function (body) {
      if (body?.success !== false && req.user) {
        const details = getDetails ? getDetails(req) : {};
        auditService.log({
          id_utilisateur: req.user.id,
          action,
          ip: req.ip,
          user_agent: req.get('User-Agent'),
          details,
        }).catch(() => {}); // Ne pas bloquer si audit échoue
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { auditLog };
