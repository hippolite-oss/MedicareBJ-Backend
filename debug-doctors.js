/**
 * Script de débogage pour vérifier les médecins publics
 */
const { Utilisateur, Professionnel } = require('./src/models');

async function debugDoctors() {
  try {
    console.log('=== Vérification des médecins publics ===\n');
    
    const doctors = await Utilisateur.findAll({
      where: {
        role: 'medecin',
        statut: 'actif',
      },
      include: [{
        model: Professionnel,
        as: 'professionnel',
        required: false,
        attributes: ['profil_public', 'statut_validation', 'specialite'],
      }],
      attributes: ['id', 'nom', 'prenom', 'email', 'role', 'statut'],
    });
    
    console.log(`Total médecins actifs: ${doctors.length}\n`);
    
    doctors.forEach((doc) => {
      const prof = doc.professionnel;
      console.log(`Dr. ${doc.prenom} ${doc.nom}`);
      console.log(`  ID: ${doc.id}`);
      console.log(`  Email: ${doc.email}`);
      console.log(`  Professionnel: ${prof ? 'OUI' : 'NON'}`);
      
      if (prof) {
        console.log(`  - profil_public: ${prof.profil_public} (type: ${typeof prof.profil_public})`);
        console.log(`  - statut_validation: ${prof.statut_validation}`);
        console.log(`  - specialite: ${prof.specialite}`);
        
        const isPublic = prof.profil_public === true;
        const isValid = prof.statut_validation === 'valide';
        const shouldBeVisible = isPublic && isValid;
        
        console.log(`  ✓ Visible dans liste publique: ${shouldBeVisible ? 'OUI' : 'NON'}`);
        console.log(`  ✓ Autorisé pour messagerie: ${shouldBeVisible ? 'OUI' : 'NON'}`);
      }
      console.log('');
    });
    
    // Vérifier spécifiquement les médecins publics
    const publicDoctors = await Utilisateur.findAll({
      where: {
        role: 'medecin',
        statut: 'actif',
      },
      include: [{
        model: Professionnel,
        as: 'professionnel',
        where: { statut_validation: 'valide', profil_public: true },
        required: true,
        attributes: ['profil_public', 'statut_validation', 'specialite'],
      }],
      attributes: ['id', 'nom', 'prenom', 'email'],
    });
    
    console.log(`\n=== Médecins publics (requête identique à l'API) ===`);
    console.log(`Total: ${publicDoctors.length}\n`);
    
    publicDoctors.forEach((doc) => {
      console.log(`✓ Dr. ${doc.prenom} ${doc.nom} (${doc.id})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Erreur:', error);
    process.exit(1);
  }
}

debugDoctors();
