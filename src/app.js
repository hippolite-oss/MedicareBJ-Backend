/**
 * app.js — Configuration Express principale
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const hpp = require('hpp');
const morgan = require('morgan');
const path = require('path');

const { globalRateLimit } = require('./middlewares/rateLimit.middleware');
const { errorHandler } = require('./middlewares/errorHandler.middleware');
const routes = require('./routes');
const { setupSwagger } = require('./config/swagger');
const logger = require('./utils/logger');

const app = express();

// ── Sécurité headers ──────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Permet le chargement des images depuis le frontend
  crossOriginEmbedderPolicy: false, // Désactive COEP pour éviter les blocages
}));

// ── CORS ──────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.MOBILE_URL   || 'http://localhost:19006',
  'http://localhost:8080', // Vite dev server (port par défaut vite.config.ts)
  'http://localhost:8081', // React Native Metro
  'http://localhost:5173', // Vite dev server alternatif
  'http://127.0.0.1:8080',
  'http://127.0.0.1:5173',
  'exp://localhost:8081',
  'https://medicare-bj-frontend.vercel.app/',
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Origine non autorisée par CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Platform'],
  exposedHeaders: ['X-Platform'],
}));

// ── Header X-Platform (web ou mobile) ────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Platform', req.headers['x-platform'] || 'unknown');
  next();
});

// ── Body parsing ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Protection pollution paramètres ──────────────────────
app.use(hpp());

// ── Logs HTTP ─────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: (msg) => logger.http(msg.trim()) },
}));

// ── Rate limiting global ──────────────────────────────────
app.use(globalRateLimit);

// ── Fichiers statiques (uploads) ─────────────────────────
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Swagger ───────────────────────────────────────────────
setupSwagger(app);

// ── Routes API ────────────────────────────────────────────
app.use('/api/v1', routes);

// ── Health check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ── 404 ───────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route introuvable', code: 'NOT_FOUND' });
});

// ── Gestionnaire d'erreurs centralisé ────────────────────
app.use(errorHandler);

module.exports = app;
