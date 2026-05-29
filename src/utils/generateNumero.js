/**
 * utils/generateNumero.js — Génération de numéros uniques
 */

/**
 * Génère un numéro de dossier médical unique
 * Format : DMB-YYYY-XXXXXXXX
 */
function generateNumeroDossier() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `DMB-${year}-${random}`;
}

/**
 * Génère un numéro de prescription unique
 * Format : ORD-YYYY-XXXXXXXX
 */
function generateNumeroOrdonnance() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `ORD-${year}-${random}`;
}

/**
 * Génère un numéro de reçu de paiement
 * Format : REC-YYYYMMDD-XXXXXX
 */
function generateNumeroRecu() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `REC-${date}-${random}`;
}

module.exports = { generateNumeroDossier, generateNumeroOrdonnance, generateNumeroRecu };
