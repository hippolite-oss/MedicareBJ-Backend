/**
 * middlewares/errorHandler.middleware.js — Gestionnaire d'erreurs centralisé
 */
const logger = require('../utils/logger');
const { error } = require('../utils/apiResponse');

function errorHandler(err, req, res, next) {
  logger.error(`Erreur : ${err.message}`, { stack: err.stack, url: req.originalUrl });

  // Erreur Joi validation
  if (err.isJoi) {
    const errors = err.details.map((d) => ({ field: d.path.join('.'), message: d.message }));
    return res.status(400).json({ success: false, message: 'Validation échouée', errors, code: 'VALIDATION_ERROR' });
  }

  // Erreur Sequelize validation
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
    return res.status(400).json({ success: false, message: 'Validation échouée', errors, code: 'VALIDATION_ERROR' });
  }

  // Erreur Sequelize unique constraint
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({ success: false, message: 'Cette valeur existe déjà', code: 'DUPLICATE_ENTRY' });
  }

  // Erreur JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Token invalide', code: 'INVALID_TOKEN' });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Token expiré', code: 'TOKEN_EXPIRED' });
  }

  // Erreur Multer
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ success: false, message: 'Fichier trop volumineux', code: 'FILE_TOO_LARGE' });
    }
    return res.status(400).json({ success: false, message: err.message, code: 'UPLOAD_ERROR' });
  }

  // Erreur générique
  return error(res, err.message || 'Erreur serveur interne', err.statusCode || 500, err.code || 'SERVER_ERROR');
}

module.exports = { errorHandler };
