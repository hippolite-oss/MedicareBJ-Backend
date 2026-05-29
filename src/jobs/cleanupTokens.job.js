/**
 * jobs/cleanupTokens.job.js — Nettoyage des tokens expirés
 */
const { RefreshToken, Utilisateur } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

async function cleanupTokensJob() {
  try {
    const [refreshCount] = await RefreshToken.destroy({ where: { expires_at: { [Op.lt]: new Date() } } });
    const [resetCount] = await Utilisateur.update(
      { reset_password_token: null, reset_password_expires: null },
      { where: { reset_password_expires: { [Op.lt]: new Date() } } }
    );
    logger.info(`Cleanup Job : ${refreshCount} refresh tokens, ${resetCount} reset tokens supprimés`);
  } catch (err) {
    logger.error('Cleanup Tokens Job erreur :', err.message);
  }
}

module.exports = { cleanupTokensJob };
