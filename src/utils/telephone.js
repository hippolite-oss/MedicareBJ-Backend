/**
 * utils/telephone.js — Normalisation des numéros béninois (ancien 8 chiffres + nouveau 10 chiffres)
 *
 * Nouveau format : +22901XXXXXXXX (10 chiffres nationaux commençant par 01)
 * Ancien format  : +22997XXXXXX  (8 chiffres nationaux)
 */

function digitsOnly(telephone) {
  return String(telephone ?? '').replace(/\D/g, '');
}

/**
 * Extrait le numéro national (sans indicatif 229)
 */
function extractNationalDigits(telephone) {
  let digits = digitsOnly(telephone);
  if (digits.startsWith('00229')) digits = digits.slice(5);
  else if (digits.startsWith('229')) digits = digits.slice(3);
  return digits;
}

/**
 * Valide un numéro mobile béninois (ancien ou nouveau format)
 */
function isValidTelephoneBJ(telephone) {
  const national = extractNationalDigits(telephone);
  // Nouveau format : 01 + 8 chiffres = 10 chiffres
  if (/^0[1-9]\d{8}$/.test(national)) return true;
  // Ancien format : 8 chiffres (ex. 97XXXXXX)
  if (/^[1-9]\d{7}$/.test(national)) return true;
  return false;
}

/**
 * Normalise vers +229XXXXXXXXXX (international)
 */
function normalizeTelephoneBJ(telephone) {
  if (!telephone || !isValidTelephoneBJ(telephone)) return null;
  const national = extractNationalDigits(telephone);
  const normalizedNational = national.length === 8 ? national : national;
  return `+229${normalizedNational}`;
}

/**
 * Format pour l'API FedaPay
 */
function formatTelephoneFedaPay(telephone, country = 'bj') {
  const national = extractNationalDigits(telephone);
  return { number: national, country: country.toLowerCase() };
}

module.exports = {
  isValidTelephoneBJ,
  normalizeTelephoneBJ,
  formatTelephoneFedaPay,
  extractNationalDigits,
};
