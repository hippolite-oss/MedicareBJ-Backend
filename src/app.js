/**
 * app.js — Configuration Express principale — OPTIMISÉE
 */
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const hpp = require("hpp");
const morgan = require("morgan");
const path = require("path");

const { globalRateLimit } = require("./middlewares/rateLimit.middleware");
const { errorHandler } = require("./middlewares/errorHandler.middleware");
const routes = require("./routes");
const { setupSwagger } = require("./config/swagger");
const logger = require("./utils/logger");

// Compression gzip/brotli (réduit la taille des réponses JSON de 60-80%)
let compression;
try {
  compression = require("compression");
} catch {
  compression = null;
}

const app = express();

// ── Compression ───────────────────────────────────────────
if (compression) {
  app.use(
    compression({
      level: 6,
      threshold: 1024, // Compresser seulement les réponses > 1KB
      filter: (req, res) => {
        if (req.headers["x-no-compression"]) return false;
        return compression.filter(req, res);
      },
    }),
  );
}

// ── Sécurité headers ──────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  }),
);

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || "http://localhost:3000",
  process.env.MOBILE_URL || "http://localhost:19006",
  "http://localhost:8080",
  "http://localhost:8081",
  "http://localhost:5173",
  "http://127.0.0.1:8080",
  "http://127.0.0.1:5173",
  "http://10.0.12.163:8080",
  "http://10.0.2.2:8081",
  "http://192.168.1.66:8081",
  "http://192.168.1.66:19006",
  "exp://localhost:8081",
  "exp://192.168.1.66:8081",
  "exp://192.168.1.66:19000",
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin))
        return callback(null, true);
      callback(new Error("Origine non autorisée par CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "X-Platform",
    ],
    exposedHeaders: ["X-Platform", "Retry-After"],
  }),
);

// ── Header X-Platform ─────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader("X-Platform", req.headers["x-platform"] || "unknown");
  next();
});

// ── Body parsing ──────────────────────────────────────────
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true, limit: "5mb" }));

// ── Protection pollution paramètres ──────────────────────
app.use(hpp());

// ── Logs HTTP (skip assets statiques) ────────────────────
app.use(
  morgan("combined", {
    skip: (req) => req.path.startsWith("/uploads"),
    stream: { write: (msg) => logger.http(msg.trim()) },
  }),
);

// ── Rate limiting global ──────────────────────────────────
app.use(globalRateLimit);

// ── Fichiers statiques avec cache headers ─────────────────
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../uploads"), {
    maxAge: "7d", // Cache navigateur 7 jours pour les images
    etag: true,
    lastModified: true,
  }),
);

// ── Swagger ───────────────────────────────────────────────
setupSwagger(app);

// ── Routes API ────────────────────────────────────────────
app.use("/api/v1", routes);

// ── Health check ─────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res
    .status(404)
    .json({ success: false, message: "Route introuvable", code: "NOT_FOUND" });
});

// ── Gestionnaire d'erreurs centralisé ────────────────────
app.use(errorHandler);

module.exports = app;
