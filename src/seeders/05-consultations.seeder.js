/**
 * seeders/05-consultations.seeder.js
 */
const { Utilisateur, DossierMedical, Consultation, Hopital } = require('../models');
const logger = require('../utils/logger');

async function run() {
  const patient = await Utilisateur.findOne({ where: { email: 'patient@medicarebi.bj' } });
  const medecin = await Utilisateur.findOne({ where: { email: 'medecin@medicarebi.bj' } });
  const dossier = await DossierMedical.findOne({ where: { id_patient: patient?.id } });
  const hopital = await Hopital.findOne({ where: { nom: 'CNHU-HKM Cotonou' } });

  if (!dossier || !medecin || !hopital) return;

  const count = await Consultation.count();
  if (count > 0) { logger.info('Consultations déjà seedées, skip.'); return; }

  await Consultation.create({
    id_dossier: dossier.id,
    id_medecin: medecin.id,
    id_hopital: hopital.id,
    motif: 'Consultation de routine',
    diagnostic: 'État général satisfaisant',
    observations: 'Continuer le suivi régulier.',
    tension_arterielle: '120/80',
    temperature: 36.8,
    poids_jour: 62,
    statut: 'terminee',
  });

  logger.info('✅ Consultation de test créée');
}

module.exports = { run };
