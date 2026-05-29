/**
 * seeders/06-medicaments.seeder.js
 */
const { Medicament } = require('../models');
const logger = require('../utils/logger');

async function seedMedicaments() {
  try {
    logger.info('🌱 Seeding medicaments...');

    const medicaments = [
      // Antalgiques / Antipyrétiques
      { nom: 'Paracétamol', dosage: '500mg', forme: 'comprimé' },
      { nom: 'Paracétamol', dosage: '1g', forme: 'comprimé' },
      { nom: 'Paracétamol', dosage: '100mg/ml', forme: 'sirop' },
      { nom: 'Ibuprofène', dosage: '200mg', forme: 'comprimé' },
      { nom: 'Ibuprofène', dosage: '400mg', forme: 'comprimé' },
      { nom: 'Aspirine', dosage: '500mg', forme: 'comprimé' },
      
      // Antibiotiques
      { nom: 'Amoxicilline', dosage: '500mg', forme: 'gélule' },
      { nom: 'Amoxicilline', dosage: '1g', forme: 'comprimé' },
      { nom: 'Amoxicilline + Acide clavulanique', dosage: '500mg/62.5mg', forme: 'comprimé' },
      { nom: 'Azithromycine', dosage: '250mg', forme: 'comprimé' },
      { nom: 'Ciprofloxacine', dosage: '500mg', forme: 'comprimé' },
      { nom: 'Métronidazole', dosage: '250mg', forme: 'comprimé' },
      
      // Anti-inflammatoires
      { nom: 'Diclofénac', dosage: '50mg', forme: 'comprimé' },
      { nom: 'Kétoprofène', dosage: '100mg', forme: 'gélule' },
      
      // Antihistaminiques
      { nom: 'Cétirizine', dosage: '10mg', forme: 'comprimé' },
      { nom: 'Loratadine', dosage: '10mg', forme: 'comprimé' },
      
      // Antiacides
      { nom: 'Oméprazole', dosage: '20mg', forme: 'gélule' },
      { nom: 'Ranitidine', dosage: '150mg', forme: 'comprimé' },
      
      // Antidiabétiques
      { nom: 'Metformine', dosage: '500mg', forme: 'comprimé' },
      { nom: 'Metformine', dosage: '850mg', forme: 'comprimé' },
      { nom: 'Glibenclamide', dosage: '5mg', forme: 'comprimé' },
      
      // Antihypertenseurs
      { nom: 'Amlodipine', dosage: '5mg', forme: 'comprimé' },
      { nom: 'Amlodipine', dosage: '10mg', forme: 'comprimé' },
      { nom: 'Énalapril', dosage: '5mg', forme: 'comprimé' },
      { nom: 'Losartan', dosage: '50mg', forme: 'comprimé' },
      
      // Vitamines et suppléments
      { nom: 'Vitamine C', dosage: '500mg', forme: 'comprimé' },
      { nom: 'Vitamine D3', dosage: '1000UI', forme: 'gélule' },
      { nom: 'Fer', dosage: '80mg', forme: 'comprimé' },
      { nom: 'Acide folique', dosage: '5mg', forme: 'comprimé' },
      
      // Antipaludéens
      { nom: 'Artéméther + Luméfantrine', dosage: '20mg/120mg', forme: 'comprimé' },
      { nom: 'Quinine', dosage: '300mg', forme: 'comprimé' },
      
      // Antitussifs / Expectorants
      { nom: 'Carbocistéine', dosage: '250mg', forme: 'gélule' },
      { nom: 'Bromhexine', dosage: '8mg', forme: 'comprimé' },
      
      // Antiémétiques
      { nom: 'Métoclopramide', dosage: '10mg', forme: 'comprimé' },
      { nom: 'Dompéridone', dosage: '10mg', forme: 'comprimé' },
    ];

    for (const med of medicaments) {
      await Medicament.findOrCreate({
        where: { nom: med.nom, dosage: med.dosage, forme: med.forme },
        defaults: med
      });
    }

    logger.info(`✅ ${medicaments.length} médicaments créés/vérifiés`);
  } catch (error) {
    logger.error('❌ Erreur seeding medicaments:', error);
    throw error;
  }
}

async function run() {
  await seedMedicaments();
}

module.exports = { seedMedicaments, run };
