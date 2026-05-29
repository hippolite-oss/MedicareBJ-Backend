/**
 * jobs/accesExpiration.job.js — Expire les accès dossiers dépassés
 */
const { AccesDossier } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

async function accesExpirationJob() {
  try {
    const [count] = await AccesDossier.update(
      { statut: 'expire' },
      { where: { statut: 'actif', date_fin: { [Op.lt]: new Date(), [Op.ne]: null } } }
    );
    if (count > 0) logger.info(`Accès Expiration Job : ${count} accès expiré(s)`);
  } catch (err) {
    logger.error('Accès Expiration Job erreur :', err.message);
  }
}

module.exports = { accesExpirationJob };
