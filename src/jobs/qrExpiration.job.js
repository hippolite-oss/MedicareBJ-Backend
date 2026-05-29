/**
 * jobs/qrExpiration.job.js — Expire les codes QR dépassés
 */
const { CodeQR } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

async function qrExpirationJob() {
  try {
    const [count] = await CodeQR.update(
      { statut: 'expire' },
      { where: { statut: 'actif', date_expiration: { [Op.lt]: new Date() } } }
    );
    if (count > 0) logger.info(`QR Expiration Job : ${count} code(s) expiré(s)`);
  } catch (err) {
    logger.error('QR Expiration Job erreur :', err.message);
  }
}

module.exports = { qrExpirationJob };
