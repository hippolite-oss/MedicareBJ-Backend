/**
 * jobs/index.js — Démarrage des tâches planifiées
 */
const cron = require('node-cron');
const logger = require('../utils/logger');

function startJobs() {
  // Expiration QR — toutes les 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    const { qrExpirationJob } = require('./qrExpiration.job');
    await qrExpirationJob();
  });

  // Rappels RDV — toutes les heures
  cron.schedule('0 * * * *', async () => {
    const { rdvRappelJob } = require('./rdvRappel.job');
    await rdvRappelJob();
  });

  // Nettoyage tokens — tous les jours à 03h00
  cron.schedule('0 3 * * *', async () => {
    const { cleanupTokensJob } = require('./cleanupTokens.job');
    await cleanupTokensJob();
  });

  // Expiration accès dossiers — toutes les heures
  cron.schedule('30 * * * *', async () => {
    const { accesExpirationJob } = require('./accesExpiration.job');
    await accesExpirationJob();
  });

  logger.info('✅ Jobs cron planifiés');
}

module.exports = { startJobs };
