/**
 * seeders/01-hopitaux.seeder.js
 */
const { Hopital } = require('../models');
const logger = require('../utils/logger');

const hopitaux = [
  { nom: 'CNHU-HKM Cotonou', type: 'CHU', ville: 'Cotonou', departement: 'Littoral', adresse: 'Avenue Jean-Paul II, Cotonou', telephone: '+229 21 30 01 55', latitude: 6.3654, longitude: 2.4183 },
  { nom: 'CHD Ouémé-Plateau', type: 'CHD', ville: 'Porto-Novo', departement: 'Ouémé', adresse: 'Rue des Gouverneurs, Porto-Novo', telephone: '+229 20 21 34 56', latitude: 6.4969, longitude: 2.6289 },
  { nom: 'CHD Atlantique-Littoral', type: 'CHD', ville: 'Ouidah', departement: 'Atlantique', adresse: 'Route de Ouidah', telephone: '+229 21 34 10 22', latitude: 6.3536, longitude: 2.0828 },
  { nom: 'Clinique Bénin Médical', type: 'clinique', ville: 'Cotonou', departement: 'Littoral', adresse: 'Haie Vive, Cotonou', telephone: '+229 21 31 45 67', latitude: 6.3702, longitude: 2.4322 },
  { nom: 'Polyclinique Les Cocotiers', type: 'clinique', ville: 'Cotonou', departement: 'Littoral', adresse: 'Akpakpa, Cotonou', telephone: '+229 21 33 22 11', latitude: 6.3589, longitude: 2.4501 },
  { nom: 'CHD Borgou-Alibori', type: 'CHD', ville: 'Parakou', departement: 'Borgou', adresse: 'Centre-ville Parakou', telephone: '+229 23 61 02 34', latitude: 9.3370, longitude: 2.6280 },
];

async function run() {
  const count = await Hopital.count();
  if (count > 0) { logger.info('Hopitaux déjà seedés, skip.'); return; }
  await Hopital.bulkCreate(hopitaux);
  logger.info(`✅ ${hopitaux.length} hôpitaux créés`);
}

module.exports = { run };
