// /**
//  * config/redis.js — Connexion Redis
//  */
// const { createClient } = require('redis');
// const logger = require('../utils/logger');

// let client = null;

// async function connectRedis() {
//   const config = {
//     socket: {
//       host: process.env.REDIS_HOST || 'localhost',
//       port: parseInt(process.env.REDIS_PORT) || 6379,
//     },
//   };
//   if (process.env.REDIS_PASSWORD) {
//     config.password = process.env.REDIS_PASSWORD;
//   }

//   client = createClient(config);

//   client.on('error', (err) => logger.error('Redis erreur :', err));
//   client.on('reconnecting', () => logger.warn('Redis reconnexion...'));

//   await client.connect();
//   return client;
// }

// function getRedis() {
//   if (!client) throw new Error('Redis non initialisé');
//   return client;
// }

// module.exports = { connectRedis, getRedis };





/**
 * config/redis.js — Connexion Redis Upstash
 */
const { Redis } = require('@upstash/redis');
const logger = require('../utils/logger');

let client = null;

async function connectRedis() {
  try {
    client = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Test de connexion
    await client.ping();

    logger.info('Redis Upstash connecté avec succès');

    return client;
  } catch (error) {
    logger.error('Erreur Redis Upstash :', error);
    throw error;
  }
}

function getRedis() {
  if (!client) {
    throw new Error('Redis non initialisé');
  }
  return client;
}

module.exports = {
  connectRedis,
  getRedis,
};