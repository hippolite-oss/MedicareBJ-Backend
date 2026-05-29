/**
 * seeders/03-profils.seeder.js
 */
const { Utilisateur, Patient, Professionnel, Hopital } = require('../models');
const logger = require('../utils/logger');

async function run() {
  const patient = await Utilisateur.findOne({ where: { email: 'patient@medicarebi.bj' } });
  const medecin = await Utilisateur.findOne({ where: { email: 'medecin@medicarebi.bj' } });
  const technicien = await Utilisateur.findOne({ where: { email: 'technicien@medicarebi.bj' } });
  const medecin2 = await Utilisateur.findOne({ where: { email: 'medecin2@medicarebi.bj' } });
  const hopital = await Hopital.findOne({ where: { nom: 'CNHU-HKM Cotonou' } });

  if (patient) {
    await Patient.findOrCreate({ where: { id_utilisateur: patient.id }, defaults: { groupe_sanguin: 'O+', allergies: 'Pénicilline', poids_kg: 62, taille_cm: 165 } });
  }

  if (medecin && hopital) {
    await Professionnel.findOrCreate({ where: { id_utilisateur: medecin.id }, defaults: { numero_ordre: 'BJ-MED-2020-0001', specialite: 'Médecin généraliste', id_hopital: hopital.id, statut_validation: 'valide', profil_public: true } });
  }

  if (technicien && hopital) {
    await Professionnel.findOrCreate({ where: { id_utilisateur: technicien.id }, defaults: { numero_ordre: 'BJ-TECH-2021-0001', specialite: 'Technicien de laboratoire', id_hopital: hopital.id, statut_validation: 'valide', profil_public: true } });
  }

  if (medecin2 && hopital) {
    await Professionnel.findOrCreate({ where: { id_utilisateur: medecin2.id }, defaults: { numero_ordre: 'BJ-MED-2025-0412', specialite: 'Cardiologue', id_hopital: hopital.id, statut_validation: 'en_attente', profil_public: true } });
  }

  logger.info('✅ Profils créés');
}

module.exports = { run };
