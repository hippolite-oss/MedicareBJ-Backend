/**
 * utils/formatDate.js — Utilitaires de formatage de dates
 */

/**
 * Formate une date en français (Bénin, UTC+1)
 */
function formatDateFR(date) {
  return new Date(date).toLocaleDateString('fr-BJ', {
    day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Africa/Porto-Novo',
  });
}

/**
 * Formate une date + heure en français
 */
function formatDateTimeFR(date) {
  return new Date(date).toLocaleString('fr-BJ', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Porto-Novo',
  });
}

/**
 * Calcule l'âge à partir d'une date de naissance
 */
function calculateAge(birthDate) {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

/**
 * Ajoute N heures à une date
 */
function addHours(date, hours) {
  return new Date(new Date(date).getTime() + hours * 60 * 60 * 1000);
}

/**
 * Ajoute N jours à une date
 */
function addDays(date, days) {
  return new Date(new Date(date).getTime() + days * 24 * 60 * 60 * 1000);
}

module.exports = { formatDateFR, formatDateTimeFR, calculateAge, addHours, addDays };
