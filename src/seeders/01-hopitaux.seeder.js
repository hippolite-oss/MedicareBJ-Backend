/**
 * seeders/01-hopitaux.seeder.js
 */
const { Hopital } = require('../models');
const logger = require('../utils/logger');

// Numéros au nouveau standard béninois (+229 + 10 chiffres, en vigueur depuis janvier 2024)
// Pour les tests sandbox FedaPay : MTN (préfixes 0196, 0197, 0162, 0163) / Moov (préfixes 0194, 0195, 0199)
const hopitaux = [
  { nom: 'CNHU-HKM Cotonou', type: 'CHU', ville: 'Cotonou', departement: 'Littoral', adresse: 'Avenue Jean-Paul II, Cotonou', telephone: '+2290196000001', latitude: 6.3654, longitude: 2.4183 },
  { nom: 'CHD Ouémé-Plateau', type: 'CHD', ville: 'Porto-Novo', departement: 'Ouémé', adresse: 'Rue des Gouverneurs, Porto-Novo', telephone: '+2290196000002', latitude: 6.4969, longitude: 2.6289 },
  { nom: 'CHD Atlantique-Littoral', type: 'CHD', ville: 'Ouidah', departement: 'Atlantique', adresse: 'Route de Ouidah', telephone: '+2290194000001', latitude: 6.3536, longitude: 2.0828 },
  { nom: 'Clinique Bénin Médical', type: 'clinique', ville: 'Cotonou', departement: 'Littoral', adresse: 'Haie Vive, Cotonou', telephone: '+2290197000001', latitude: 6.3702, longitude: 2.4322 },
  { nom: 'Polyclinique Les Cocotiers', type: 'clinique', ville: 'Cotonou', departement: 'Littoral', adresse: 'Akpakpa, Cotonou', telephone: '+2290195000001', latitude: 6.3589, longitude: 2.4501 },
  { nom: 'CHD Borgou-Alibori', type: 'CHD', ville: 'Parakou', departement: 'Borgou', adresse: 'Centre-ville Parakou', telephone: '+2290196000003', latitude: 9.3370, longitude: 2.6280 },
];

async function run() {
  const count = await Hopital.count();
  if (count > 0) { logger.info('Hopitaux déjà seedés, skip.'); return; }
  await Hopital.bulkCreate(hopitaux);
  logger.info(`✅ ${hopitaux.length} hôpitaux créés`);
}

module.exports = { run };
