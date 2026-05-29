/**
 * seeders/run.js — Exécute tous les seeders dans l'ordre
 */
require('dotenv').config();
const { connectDB } = require('../config/database');
const logger = require('../utils/logger');

async function runSeeders() {
  await connectDB();
  logger.info('🌱 Démarrage des seeders...');

  const seeders = [
    require('./01-hopitaux.seeder'),
    require('./02-utilisateurs.seeder'),
    require('./03-profils.seeder'),
    require('./04-dossiers.seeder'),
    require('./05-consultations.seeder'),
    require('./06-medicaments.seeder'),
  ];

  for (const seeder of seeders) {
    await seeder.run();
  }

  logger.info('✅ Seeders terminés');
  process.exit(0);
}

runSeeders().catch((err) => { logger.error(err); process.exit(1); });
