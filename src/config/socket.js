/**
 * config/socket.js — Configuration Socket.io optimisée
 * - Rate limiting des événements socket
 * - Prévention des boucles d'événements
 * - Gestion propre des rooms
 */
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("../utils/logger");

let io = null;

// Map pour rate-limiter les événements socket par utilisateur
const socketEventCounts = new Map();
const SOCKET_RATE_WINDOW = 10000; // 10 secondes
const SOCKET_MAX_EVENTS = 50; // 50 événements max par 10s par user

function checkSocketRateLimit(userId) {
  const now = Date.now();
  const userData = socketEventCounts.get(userId) || {
    count: 0,
    resetAt: now + SOCKET_RATE_WINDOW,
  };

  if (now > userData.resetAt) {
    socketEventCounts.set(userId, {
      count: 1,
      resetAt: now + SOCKET_RATE_WINDOW,
    });
    return true;
  }

  if (userData.count >= SOCKET_MAX_EVENTS) {
    logger.warn(`[Socket] Rate limit dépassé pour user ${userId}`);
    return false;
  }

  userData.count++;
  socketEventCounts.set(userId, userData);
  return true;
}

// Nettoyage périodique de la Map
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of socketEventCounts.entries()) {
    if (now > value.resetAt) socketEventCounts.delete(key);
  }
}, 30000);

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        process.env.FRONTEND_URL || "http://localhost:3000",
        process.env.MOBILE_URL || "http://localhost:19006",
        "http://localhost:8081",
        "http://10.0.2.2:8081",
        "http://192.168.1.66:8081",
        "http://192.168.1.66:19006",
        "exp://localhost:8081",
        "exp://192.168.1.66:8081",
        "exp://192.168.1.66:19000",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 30000, // Réduit de 60s à 30s
    pingInterval: 25000, // Ping toutes les 25s
    maxHttpBufferSize: 1e6, // 1MB max par message
    transports: ["websocket"], // Forcer WebSocket uniquement
  });

  // ── Middleware d'authentification ─────────────────────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error("Token manquant"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error("Token invalide"));
    }
  });

  // ── Gestion des connexions ────────────────────────────────────────────────
  io.on("connection", (socket) => {
    const userId = socket.user?.id;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    logger.info(`[Socket] Connecté: user ${userId} (${socket.id})`);

    // Rejoindre la room personnelle
    socket.join(`user:${userId}`);

    // Room admin
    if (socket.user?.role === "admin") socket.join("admin:global");

    // ── Événements clients avec rate limiting ───────────────────────────────

    socket.on("join_room", ({ roomId }) => {
      if (!checkSocketRateLimit(userId)) return;
      if (typeof roomId === "string" && roomId.length < 100) {
        socket.join(roomId);
      }
    });

    socket.on("message_typing", ({ id_destinataire }) => {
      if (!checkSocketRateLimit(userId)) return;
      if (id_destinataire) {
        socket.to(`user:${id_destinataire}`).emit("user_typing", {
          id_expediteur: userId,
          timestamp: Date.now(),
        });
      }
    });

    socket.on("message_read", ({ id_expediteur }) => {
      if (!checkSocketRateLimit(userId)) return;
      if (id_expediteur) {
        socket.to(`user:${id_expediteur}`).emit("messages_read", {
          id_lecteur: userId,
        });
      }
    });

    socket.on("disconnect", (reason) => {
      logger.info(`[Socket] Déconnecté: user ${userId} — raison: ${reason}`);
    });

    socket.on("error", (err) => {
      logger.error(`[Socket] Erreur user ${userId}:`, err.message);
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io non initialisé");
  return io;
}

module.exports = { initSocket, getIO };
