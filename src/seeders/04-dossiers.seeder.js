/**
 * seeders/04-dossiers.seeder.js
 */
const { Utilisateur, DossierMedical } = require('../models');
const { generateNumeroDossier } = require('../utils/generateNumero');
const logger = require('../utils/logger');

async function run() {
  const patient = await Utilisateur.findOne({ where: { email: 'patient@medicarebi.bj' } });
  if (!patient) return;

  await DossierMedical.findOrCreate({
    where: { id_patient: patient.id },
    defaults: { numero_dossier: generateNumeroDossier(), statut: 'actif' },
  });

  logger.info('✅ Dossier médical créé');
}

module.exports = { run };
