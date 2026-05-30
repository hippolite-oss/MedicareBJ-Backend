/**
 * config/socket.js — Configuration Socket.io
 */
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

let io = null;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:8081',
      ],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  // Middleware d'authentification Socket.io
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('Token manquant'));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error('Token invalide'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user?.id;
    logger.info(`Socket connecté : user ${userId}`);

    // Rejoindre la room personnelle
    socket.join(`user:${userId}`);

    // Rejoindre la room admin si admin
    if (socket.user?.role === 'admin') {
      socket.join('admin:global');
    }

    // Rejoindre une room de conversation
    socket.on('join_room', ({ roomId }) => {
      socket.join(roomId);
    });

    // Indicateur de frappe
    socket.on('message_typing', ({ id_destinataire }) => {
      socket.to(`user:${id_destinataire}`).emit('user_typing', { id_expediteur: userId });
    });

    // Marquer messages comme lus
    socket.on('message_read', ({ id_expediteur }) => {
      socket.to(`user:${id_expediteur}`).emit('messages_read', { id_lecteur: userId });
    });

    socket.on('disconnect', () => {
      logger.info(`Socket déconnecté : user ${userId}`);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error('Socket.io non initialisé');
  return io;
}

module.exports = { initSocket, getIO };
