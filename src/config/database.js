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

async function connectDB() {
  await sequelize.authenticate();
  logger.info('PostgreSQL authentifié');

  // Ne pas utiliser sync({ alter: true }) par défaut : tables déjà créées via migrations SQL.
  // alter:true provoque des ALTER massifs et peut faire planter PostgreSQL (mémoire épuisée).
  if (process.env.DB_SYNC_ALTER === 'true') {
    logger.warn('DB_SYNC_ALTER=true — synchronisation Sequelize avec alter (lent)');
    await sequelize.sync({ alter: true });
  }
}

module.exports = { sequelize, connectDB };
