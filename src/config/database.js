/**
 * config/database.js — Connexion Sequelize PostgreSQL
 */
const { Sequelize } = require('sequelize');
const logger = require('../utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'carnet_soins_numerique',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    dialect: 'postgres',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10,
      min: parseInt(process.env.DB_POOL_MIN) || 2,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      underscored: false,
      timestamps: true,
    },
    dialectOptions: {
      timezone: '+01:00', // UTC+1 (Bénin)
    },
  }
);

/**
 * Connexion PostgreSQL + synchronisation Sequelize
 */
async function connectDB() {
  try {
    await sequelize.authenticate();
    logger.info('PostgreSQL authentifié');

    // Création simple des tables si elles n'existent pas
    if (process.env.DB_SYNC === 'true') {
      logger.info('Synchronisation simple des tables...');
      await sequelize.sync();
    }

    // Mise à jour automatique des tables
    if (process.env.DB_SYNC_ALTER === 'true') {
      logger.warn('Synchronisation ALTER activée...');
      await sequelize.sync({ alter: true });
    }

    // Suppression + recréation complète
    if (process.env.DB_SYNC_FORCE === 'true') {
      logger.warn('Synchronisation FORCE activée (suppression totale)...');
      await sequelize.sync({ force: true });
    }

    logger.info('Base de données prête');

  } catch (error) {
    logger.error('Erreur connexion PostgreSQL :', error);
    process.exit(1);
  }
}

module.exports = { sequelize, connectDB };
