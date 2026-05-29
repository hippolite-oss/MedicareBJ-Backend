/**
 * seeders/02-utilisateurs.seeder.js
 */
const { Utilisateur } = require('../models');
const { hashPassword } = require('../utils/hashPassword');
const logger = require('../utils/logger');

async function run() {
  const count = await Utilisateur.count();
  if (count > 0) { logger.info('Utilisateurs déjà seedés, skip.'); return; }

  const password = await hashPassword('Password123!');

  await Utilisateur.bulkCreate([
    { nom: 'Admin', prenom: 'Super', email: 'admin@medicarebi.bj', mot_de_passe: password, role: 'admin', statut: 'actif', telephone: '+22997000001' },
    { nom: 'Hounkpatin', prenom: 'Adjoa', email: 'patient@medicarebi.bj', mot_de_passe: password, role: 'patient', statut: 'actif', telephone: '+22997000002', date_naissance: '1990-05-15', sexe: 'F' },
    { nom: 'Adoukonou', prenom: 'Kossi', email: 'medecin@medicarebi.bj', mot_de_passe: password, role: 'medecin', statut: 'actif', telephone: '+22997000003', date_naissance: '1980-03-20', sexe: 'M' },
    { nom: 'Agossou', prenom: 'Romuald', email: 'technicien@medicarebi.bj', mot_de_passe: password, role: 'technicien', statut: 'actif', telephone: '+22997000004', sexe: 'M' },
    { nom: 'Sogbo', prenom: 'Aminata', email: 'medecin2@medicarebi.bj', mot_de_passe: password, role: 'medecin', statut: 'en_attente', telephone: '+22997000005', sexe: 'F' },
  ]);

  logger.info('✅ 5 utilisateurs de test créés (mot de passe : Password123!)');
}

module.exports = { run };
