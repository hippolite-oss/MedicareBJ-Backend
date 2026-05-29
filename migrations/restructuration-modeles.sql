-- ============================================================================
-- Migration: Restructuration des modèles de base de données
-- Date: 2026-05-17
-- Description: 
--   1. Renommer profils_medicaux en patients avec id_utilisateur comme PK
--   2. Renommer profils_professionnels en professionnels avec id_utilisateur comme PK
--   3. Créer la table medicaments
--   4. Modifier medicaments_prescrits pour devenir une table d'association
-- ============================================================================

-- ============================================================================
-- ÉTAPE 1: Créer la nouvelle table medicaments
-- ============================================================================
CREATE TABLE IF NOT EXISTS medicaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  forme VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ÉTAPE 2: Renommer profils_medicaux en patients et restructurer
-- ============================================================================

-- Créer la nouvelle table patients
CREATE TABLE IF NOT EXISTS patients (
  id_utilisateur UUID PRIMARY KEY REFERENCES utilisateurs(id) ON DELETE CASCADE,
  groupe_sanguin VARCHAR(3) CHECK (groupe_sanguin IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  allergies TEXT,
  antecedents TEXT,
  poids_kg DECIMAL(5, 2),
  taille_cm INTEGER,
  medecin_traitant VARCHAR(255),
  mutuelle VARCHAR(255),
  numero_securite_sociale VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrer les données de profils_medicaux vers patients
INSERT INTO patients (
  id_utilisateur, groupe_sanguin, allergies, antecedents, 
  poids_kg, taille_cm, medecin_traitant, mutuelle, 
  numero_securite_sociale, created_at, updated_at
)
SELECT 
  id_utilisateur, groupe_sanguin, allergies, antecedents,
  poids_kg, taille_cm, medecin_traitant, mutuelle,
  numero_securite_sociale, created_at, updated_at
FROM profils_medicaux
ON CONFLICT (id_utilisateur) DO NOTHING;

-- Supprimer l'ancienne table (après vérification)
-- DROP TABLE IF EXISTS profils_medicaux CASCADE;

-- ============================================================================
-- ÉTAPE 3: Renommer profils_professionnels en professionnels et restructurer
-- ============================================================================

-- Créer la nouvelle table professionnels
CREATE TABLE IF NOT EXISTS professionnels (
  id_utilisateur UUID PRIMARY KEY REFERENCES utilisateurs(id) ON DELETE CASCADE,
  id_hopital UUID REFERENCES hopitaux(id) ON DELETE SET NULL,
  numero_ordre VARCHAR(100) NOT NULL UNIQUE,
  specialite VARCHAR(150) NOT NULL,
  statut_validation VARCHAR(20) CHECK (statut_validation IN ('en_attente', 'valide', 'rejete')) DEFAULT 'en_attente',
  motif_rejet TEXT,
  profil_public BOOLEAN DEFAULT TRUE,
  biographie TEXT,
  tarif_consultation DECIMAL(10, 2),
  date_validation TIMESTAMP,
  valide_par UUID REFERENCES utilisateurs(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migrer les données de profils_professionnels vers professionnels
INSERT INTO professionnels (
  id_utilisateur, id_hopital, numero_ordre, specialite,
  statut_validation, motif_rejet, profil_public, biographie,
  tarif_consultation, date_validation, valide_par, created_at, updated_at
)
SELECT 
  id_utilisateur, id_hopital, numero_ordre, specialite,
  statut_validation, motif_rejet, profil_public, biographie,
  tarif_consultation, date_validation, valide_par, created_at, updated_at
FROM profils_professionnels
ON CONFLICT (id_utilisateur) DO NOTHING;

-- Supprimer l'ancienne table (après vérification)
-- DROP TABLE IF EXISTS profils_professionnels CASCADE;

-- ============================================================================
-- ÉTAPE 4: Restructurer medicaments_prescrits
-- ============================================================================

-- Sauvegarder les données existantes dans une table temporaire
CREATE TABLE IF NOT EXISTS medicaments_prescrits_backup AS
SELECT * FROM medicaments_prescrits;

-- Créer d'abord les médicaments à partir des données existantes
INSERT INTO medicaments (nom, dosage, forme)
SELECT DISTINCT nom_medicament, dosage, forme
FROM medicaments_prescrits_backup
WHERE nom_medicament IS NOT NULL
ON CONFLICT DO NOTHING;

-- Supprimer l'ancienne table
DROP TABLE IF EXISTS medicaments_prescrits CASCADE;

-- Créer la nouvelle table d'association
CREATE TABLE medicaments_prescrits (
  id_prescription UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  id_medicament UUID NOT NULL REFERENCES medicaments(id) ON DELETE CASCADE,
  frequence VARCHAR(200) NOT NULL,
  duree_jours INTEGER,
  instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_prescription, id_medicament)
);

-- Migrer les données (nécessite une correspondance manuelle ou un script)
-- Cette partie doit être adaptée selon vos besoins spécifiques
-- car il faut faire correspondre les anciens médicaments avec les nouveaux IDs

INSERT INTO medicaments_prescrits (id_prescription, id_medicament, frequence, duree_jours, instructions)
SELECT 
  mp.id_prescription,
  m.id,
  mp.frequence,
  mp.duree_jours,
  mp.instructions
FROM medicaments_prescrits_backup mp
INNER JOIN medicaments m ON (
  m.nom = mp.nom_medicament 
  AND m.dosage = mp.dosage 
  AND (m.forme = mp.forme OR (m.forme IS NULL AND mp.forme IS NULL))
)
ON CONFLICT (id_prescription, id_medicament) DO NOTHING;

-- Supprimer la table de backup (après vérification)
-- DROP TABLE IF EXISTS medicaments_prescrits_backup;

-- ============================================================================
-- ÉTAPE 5: Créer des index pour optimiser les performances
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_medicaments_nom ON medicaments(nom);
CREATE INDEX IF NOT EXISTS idx_medicaments_prescrits_prescription ON medicaments_prescrits(id_prescription);
CREATE INDEX IF NOT EXISTS idx_medicaments_prescrits_medicament ON medicaments_prescrits(id_medicament);
CREATE INDEX IF NOT EXISTS idx_patients_utilisateur ON patients(id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_professionnels_utilisateur ON professionnels(id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_professionnels_hopital ON professionnels(id_hopital);

-- ============================================================================
-- NOTES IMPORTANTES:
-- ============================================================================
-- 1. Exécuter cette migration dans une transaction pour pouvoir faire un ROLLBACK en cas d'erreur
-- 2. Faire une sauvegarde complète de la base de données avant d'exécuter
-- 3. Tester d'abord sur un environnement de développement
-- 4. Les lignes commentées (DROP TABLE) doivent être décommentées après vérification
-- 5. Mettre à jour tous les contrôleurs et services qui référencent les anciens noms
-- ============================================================================
