/**
 * utils/fedapay.js — Helpers FedaPay (téléphone, réponses API)
 */

const FEDAPAY_MODES_MOBILE = {
  mtn_money: 'mtn_open',
  moov_money: 'moov',
};

/**
 * Déballer les réponses API FedaPay (formats v1/transaction, etc.)
 */
function unwrapFedaPayResource(data) {
  if (!data || typeof data !== 'object') return data;
  if (data['v1/transaction']) return data['v1/transaction'];
  if (data['v1/event']) return data['v1/event'];
  if (data.transaction) return data.transaction;
  if (data.entity) return data.entity;
  return data;
}

const { formatTelephoneFedaPay: formatTelephoneBJ } = require('./telephone');

/** @deprecated utiliser telephone.js — conservé pour compatibilité des imports */
function formatTelephoneFedaPay(telephone, country = 'bj') {
  return formatTelephoneBJ(telephone, country);
}

function getFedaPayBaseUrl() {
  return process.env.FEDAPAY_ENVIRONMENT === 'live'
    ? 'https://api.fedapay.com/v1'
    : 'https://sandbox-api.fedapay.com/v1';
}

function mapStatutFedaPay(status) {
  const s = String(status || '').toLowerCase();
  if (['approved', 'completed', 'complete', 'transferred'].includes(s)) return 'complete';
  if (['declined', 'canceled', 'cancelled', 'failed', 'echoue'].includes(s)) return 'echoue';
  return 'en_attente';
}

module.exports = {
  FEDAPAY_MODES_MOBILE,
  unwrapFedaPayResource,
  formatTelephoneFedaPay,
  getFedaPayBaseUrl,
  mapStatutFedaPay,
};
