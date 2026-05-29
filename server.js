/**
 * server.js — Point d'entrée de l'application MediCare BJ Backend
 */
require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const { initSocket } = require('./src/config/socket');
const { connectDB } = require('./src/config/database');
const { connectRedis } = require('./src/config/redis');
const logger = require('./src/utils/logger');
const { startJobs } = require('./src/jobs');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connexion base de données
    await connectDB();
    logger.info('✅ POSGRESQL connecté');

    // Connexion Redis
    await connectRedis();
    logger.info('✅ Redis connecté');

    // Créer le serveur HTTP
    const server = http.createServer(app);

    // Initialiser Socket.io
    initSocket(server);
    logger.info('✅ Socket.io initialisé');

    // Démarrer les tâches cron
    startJobs();
    logger.info('✅ Tâches planifiées démarrées');

    // Lancer le serveur
    server.listen(PORT, () => {
      logger.info(`🚀 Serveur MediCare BJ démarré sur le port ${PORT}`);
      logger.info(`📚 Documentation Swagger : http://localhost:${PORT}/api/v1/docs`);
      logger.info(`🌍 Environnement : ${process.env.NODE_ENV}`);
    });

    // Gestion arrêt propre
    process.on('SIGTERM', () => {
      logger.info('SIGTERM reçu. Arrêt propre...');
      server.close(() => process.exit(0));
    });

  } catch (error) {
    logger.error('❌ Erreur démarrage serveur :', error);
    process.exit(1);
  }
}

startServer();
