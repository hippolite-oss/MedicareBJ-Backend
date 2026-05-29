/**
 * fix-passwords.js - Script pour vérifier et corriger les mots de passe
 * 
 * Ce script vérifie tous les utilisateurs et identifie ceux qui ont :
 * - Un mot de passe null/undefined
 * - Un mot de passe non hashé (ne commence pas par $2b$ ou $2a$)
 * 
 * Usage: node fix-passwords.js
 */

require('dotenv').config();
const { Utilisateur } = require('./src/models');
const { hashPassword } = require('./src/utils/hashPassword');
const logger = require('./src/utils/logger');

async function checkAndFixPasswords() {
  try {
    console.log('🔍 Vérification des mots de passe...\n');

    // Récupérer tous les utilisateurs
    const users = await Utilisateur.unscoped().findAll({
      attributes: ['id', 'email', 'nom', 'prenom', 'role', 'mot_de_passe'],
    });

    console.log(`📊 Total utilisateurs : ${users.length}\n`);

    const problematic = [];
    const valid = [];

    for (const user of users) {
      if (!user.mot_de_passe) {
        problematic.push({
          ...user.toJSON(),
          issue: 'MOT_DE_PASSE_NULL',
          description: 'Mot de passe null ou undefined',
        });
      } else if (!user.mot_de_passe.startsWith('$2b$') && !user.mot_de_passe.startsWith('$2a$')) {
        problematic.push({
          ...user.toJSON(),
          issue: 'MOT_DE_PASSE_NON_HASHE',
          description: 'Mot de passe en clair (non hashé)',
        });
      } else {
        valid.push(user);
      }
    }

    console.log(`✅ Utilisateurs avec mot de passe valide : ${valid.length}`);
    console.log(`❌ Utilisateurs avec problème : ${problematic.length}\n`);

    if (problematic.length > 0) {
      console.log('📋 Détails des utilisateurs problématiques :\n');
      problematic.forEach((user, index) => {
        console.log(`${index + 1}. ${user.prenom} ${user.nom} (${user.email})`);
        console.log(`   ID: ${user.id}`);
        console.log(`   Rôle: ${user.role}`);
        console.log(`   Problème: ${user.description}`);
        console.log(`   Mot de passe actuel: ${user.mot_de_passe || 'NULL'}`);
        console.log('');
      });

      console.log('\n⚠️  CORRECTION AUTOMATIQUE\n');
      console.log('Pour ces utilisateurs, un mot de passe temporaire sera défini : "TempPassword123!"\n');
      console.log('Les utilisateurs devront utiliser "Mot de passe oublié" pour le réinitialiser.\n');

      // Demander confirmation (en mode interactif)
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question('Voulez-vous corriger automatiquement ces utilisateurs ? (oui/non) : ', async (answer) => {
        if (answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o') {
          console.log('\n🔧 Correction en cours...\n');

          const tempPassword = await hashPassword('TempPassword123!');
          let fixed = 0;

          for (const user of problematic) {
            try {
              await Utilisateur.update(
                { mot_de_passe: tempPassword },
                { where: { id: user.id } }
              );
              console.log(`✅ ${user.email} - Mot de passe corrigé`);
              fixed++;
            } catch (error) {
              console.log(`❌ ${user.email} - Erreur : ${error.message}`);
            }
          }

          console.log(`\n✅ ${fixed}/${problematic.length} utilisateurs corrigés`);
          console.log('\n📧 Informez les utilisateurs concernés de réinitialiser leur mot de passe via "Mot de passe oublié"');
        } else {
          console.log('\n❌ Correction annulée');
        }

        rl.close();
        process.exit(0);
      });
    } else {
      console.log('✅ Tous les mots de passe sont valides !');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Erreur :', error);
    process.exit(1);
  }
}

// Exécuter le script
checkAndFixPasswords();
