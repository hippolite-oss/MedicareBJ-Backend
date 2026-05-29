/**
 * config/mailer.js — Configuration Nodemailer
 */
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: { rejectUnauthorized: false },
  });

  // Vérification en développement
  if (process.env.NODE_ENV === 'development') {
    transporter.verify((err) => {
      if (err) logger.warn('SMTP non disponible :', err.message);
      else logger.info('✅ SMTP prêt');
    });
  }

  return transporter;
}

module.exports = { getTransporter };
