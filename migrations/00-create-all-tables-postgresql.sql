-- ============================================================================
-- Migration PostgreSQL: Création complète de toutes les tables
-- Date: 2026-05-17
-- Description: Crée toutes les tables de la base de données avec la nouvelle structure
-- ============================================================================

-- Activer l'extension UUID si nécessaire
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TABLE: hopitaux
-- ============================================================================
CREATE TABLE IF NOT EXISTS hopitaux (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(255) NOT NULL,
  adresse TEXT,
  ville VARCHAR(100),
  telephone VARCHAR(20),
  email VARCHAR(255),
  type_etablissement VARCHAR(50),
  nombre_lits INTEGER,
  services_disponibles TEXT,
  horaires_ouverture VARCHAR(255),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: utilisateurs
-- ============================================================================
CREATE TABLE IF NOT EXISTS utilisateurs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(100) NOT NULL,
  prenom VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  mot_de_passe VARCHAR(255) NOT NULL,
  telephone VARCHAR(20),
  date_naissance DATE,
  sexe VARCHAR(10) CHECK (sexe IN ('M', 'F', 'autre')),
  role VARCHAR(20) CHECK (role IN ('patient', 'usager', 'medecin', 'technicien', 'admin')) NOT NULL DEFAULT 'patient',
  statut VARCHAR(20) CHECK (statut IN ('actif', 'en_attente', 'suspendu', 'supprime')) NOT NULL DEFAULT 'actif',
  photo_profil VARCHAR(500),
  derniere_connexion TIMESTAMP,
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP,
  fcm_token VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: patients (anciennement profils_medicaux)
-- ============================================================================
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

-- ============================================================================
-- TABLE: professionnels (anciennement profils_professionnels)
-- ============================================================================
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

-- ============================================================================
-- TABLE: dossiers_medicaux
-- ============================================================================
CREATE TABLE IF NOT EXISTS dossiers_medicaux (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_patient UUID NOT NULL UNIQUE REFERENCES utilisateurs(id) ON DELETE CASCADE,
  numero_dossier VARCHAR(50) NOT NULL UNIQUE,
  date_creation DATE DEFAULT CURRENT_DATE,
  date_mise_a_jour TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: codes_qr
-- ============================================================================
CREATE TABLE IF NOT EXISTS codes_qr (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_dossier UUID NOT NULL REFERENCES dossiers_medicaux(id) ON DELETE CASCADE,
  code_qr VARCHAR(255) NOT NULL UNIQUE,
  date_generation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_expiration TIMESTAMP,
  statut VARCHAR(20) CHECK (statut IN ('actif', 'expire', 'revoque')) DEFAULT 'actif',
  nombre_utilisations INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: acces_dossiers
-- ============================================================================
CREATE TABLE IF NOT EXISTS acces_dossiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_dossier UUID NOT NULL REFERENCES dossiers_medicaux(id) ON DELETE CASCADE,
  id_professionnel UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  type_acces VARCHAR(20) CHECK (type_acces IN ('lecture', 'ecriture', 'complet')) DEFAULT 'lecture',
  date_debut TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_fin TIMESTAMP,
  accorde_par VARCHAR(20) CHECK (accorde_par IN ('patient', 'qr_code', 'admin')) DEFAULT 'patient',
  statut VARCHAR(20) CHECK (statut IN ('actif', 'expire', 'revoque')) DEFAULT 'actif',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: consultations
-- ============================================================================
CREATE TABLE IF NOT EXISTS consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_dossier UUID NOT NULL REFERENCES dossiers_medicaux(id) ON DELETE CASCADE,
  id_medecin UUID NOT NULL REFERENCES utilisateurs(id),
  id_hopital UUID REFERENCES hopitaux(id),
  date_consultation TIMESTAMP NOT NULL,
  motif TEXT,
  diagnostic TEXT,
  observations TEXT,
  tension_arterielle VARCHAR(20),
  temperature DECIMAL(4, 2),
  poids DECIMAL(5, 2),
  taille INTEGER,
  statut VARCHAR(20) CHECK (statut IN ('planifiee', 'en_cours', 'terminee', 'annulee')) DEFAULT 'planifiee',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: medicaments
-- ============================================================================
CREATE TABLE IF NOT EXISTS medicaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nom VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  forme VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: prescriptions
-- ============================================================================
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_consultation UUID NOT NULL UNIQUE REFERENCES consultations(id) ON DELETE CASCADE,
  id_medecin UUID NOT NULL REFERENCES utilisateurs(id),
  id_dossier UUID NOT NULL REFERENCES dossiers_medicaux(id),
  numero_ordonnance VARCHAR(50) NOT NULL UNIQUE,
  date_prescription DATE DEFAULT CURRENT_DATE,
  instructions_generales TEXT,
  statut VARCHAR(20) CHECK (statut IN ('active', 'terminee', 'annulee')) DEFAULT 'active',
  pdf_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: medicaments_prescrits (table d'association)
-- ============================================================================
CREATE TABLE IF NOT EXISTS medicaments_prescrits (
  id_prescription UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  id_medicament UUID NOT NULL REFERENCES medicaments(id) ON DELETE CASCADE,
  frequence VARCHAR(200) NOT NULL,
  duree_jours INTEGER,
  instructions TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_prescription, id_medicament)
);

-- ============================================================================
-- TABLE: analyses
-- ============================================================================
CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_dossier UUID NOT NULL REFERENCES dossiers_medicaux(id) ON DELETE CASCADE,
  id_consultation UUID REFERENCES consultations(id),
  type_analyse VARCHAR(100) NOT NULL,
  date_demande TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  date_resultat TIMESTAMP,
  resultats TEXT,
  interpretation TEXT,
  fichier_url VARCHAR(500),
  statut VARCHAR(20) CHECK (statut IN ('en_attente', 'en_cours', 'termine', 'annule')) DEFAULT 'en_attente',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: rendez_vous
-- ============================================================================
CREATE TABLE IF NOT EXISTS rendez_vous (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_patient UUID NOT NULL REFERENCES utilisateurs(id),
  id_medecin UUID NOT NULL REFERENCES utilisateurs(id),
  id_hopital UUID REFERENCES hopitaux(id),
  date_heure TIMESTAMP NOT NULL,
  duree_minutes INTEGER DEFAULT 30,
  motif TEXT,
  statut VARCHAR(20) CHECK (statut IN ('planifie', 'confirme', 'annule', 'termine')) DEFAULT 'planifie',
  notes_medecin TEXT,
  rappel_envoye BOOLEAN DEFAULT FALSE,
  annule_par VARCHAR(20) CHECK (annule_par IN ('patient', 'medecin', 'admin')),
  motif_annulation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: agenda_medecins
-- ============================================================================
CREATE TABLE IF NOT EXISTS agenda_medecins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_medecin UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  id_rdv UUID REFERENCES rendez_vous(id) ON DELETE SET NULL,
  date_debut TIMESTAMP NOT NULL,
  date_fin TIMESTAMP NOT NULL,
  type VARCHAR(20) CHECK (type IN ('disponible', 'occupe', 'conge', 'urgence')) DEFAULT 'disponible',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: paiements
-- ============================================================================
CREATE TABLE IF NOT EXISTS paiements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_patient UUID NOT NULL REFERENCES utilisateurs(id),
  id_rdv UUID REFERENCES rendez_vous(id),
  id_consultation UUID REFERENCES consultations(id),
  montant DECIMAL(10, 2) NOT NULL,
  devise VARCHAR(3) DEFAULT 'XOF',
  methode_paiement VARCHAR(50) CHECK (methode_paiement IN ('mtn_momo', 'moov_money', 'cinetpay', 'especes', 'carte')) NOT NULL,
  statut VARCHAR(20) CHECK (statut IN ('en_attente', 'reussi', 'echoue', 'rembourse')) DEFAULT 'en_attente',
  reference_transaction VARCHAR(255) UNIQUE,
  date_paiement TIMESTAMP,
  recu_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: messages
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_expediteur UUID NOT NULL REFERENCES utilisateurs(id),
  id_destinataire UUID NOT NULL REFERENCES utilisateurs(id),
  contenu TEXT NOT NULL,
  lu BOOLEAN DEFAULT FALSE,
  date_lecture TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_utilisateur UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  titre VARCHAR(255) NOT NULL,
  contenu TEXT NOT NULL,
  lien VARCHAR(500),
  lu BOOLEAN DEFAULT FALSE,
  date_lecture TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: signalements
-- ============================================================================
CREATE TABLE IF NOT EXISTS signalements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_emetteur UUID NOT NULL REFERENCES utilisateurs(id),
  id_cible UUID REFERENCES utilisateurs(id),
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  statut VARCHAR(20) CHECK (statut IN ('en_attente', 'en_cours', 'resolu', 'rejete')) DEFAULT 'en_attente',
  traite_par UUID REFERENCES utilisateurs(id),
  date_traitement TIMESTAMP,
  reponse TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: journal_audit
-- ============================================================================
CREATE TABLE IF NOT EXISTS journal_audit (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_utilisateur UUID REFERENCES utilisateurs(id),
  action VARCHAR(100) NOT NULL,
  table_concernee VARCHAR(100),
  id_enregistrement UUID,
  details JSONB,
  ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TABLE: refresh_tokens
-- ============================================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  id_utilisateur UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INDEX pour optimiser les performances
-- ============================================================================

-- Index sur les clés étrangères
CREATE INDEX IF NOT EXISTS idx_patients_utilisateur ON patients(id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_professionnels_utilisateur ON professionnels(id_utilisateur);
CREATE INDEX IF NOT EXISTS idx_professionnels_hopital ON professionnels(id_hopital);
CREATE INDEX IF NOT EXISTS idx_dossiers_patient ON dossiers_medicaux(id_patient);
CREATE INDEX IF NOT EXISTS idx_consultations_dossier ON consultations(id_dossier);
CREATE INDEX IF NOT EXISTS idx_consultations_medecin ON consultations(id_medecin);
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation ON prescriptions(id_consultation);
CREATE INDEX IF NOT EXISTS idx_prescriptions_dossier ON prescriptions(id_dossier);
CREATE INDEX IF NOT EXISTS idx_analyses_dossier ON analyses(id_dossier);
CREATE INDEX IF NOT EXISTS idx_rendez_vous_patient ON rendez_vous(id_patient);
CREATE INDEX IF NOT EXISTS idx_rendez_vous_medecin ON rendez_vous(id_medecin);
CREATE INDEX IF NOT EXISTS idx_messages_expediteur ON messages(id_expediteur);
CREATE INDEX IF NOT EXISTS idx_messages_destinataire ON messages(id_destinataire);
CREATE INDEX IF NOT EXISTS idx_notifications_utilisateur ON notifications(id_utilisateur);

-- Index sur les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_medicaments_nom ON medicaments(nom);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_email ON utilisateurs(email);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_role ON utilisateurs(role);
CREATE INDEX IF NOT EXISTS idx_utilisateurs_statut ON utilisateurs(statut);
CREATE INDEX IF NOT EXISTS idx_rendez_vous_date ON rendez_vous(date_heure);
CREATE INDEX IF NOT EXISTS idx_consultations_date ON consultations(date_consultation);

-- Index composites
CREATE INDEX IF NOT EXISTS idx_medicaments_prescrits_prescription ON medicaments_prescrits(id_prescription);
CREATE INDEX IF NOT EXISTS idx_medicaments_prescrits_medicament ON medicaments_prescrits(id_medicament);
CREATE INDEX IF NOT EXISTS idx_acces_dossiers_dossier_pro ON acces_dossiers(id_dossier, id_professionnel);

-- Index pour les recherches textuelles
CREATE INDEX IF NOT EXISTS idx_medicaments_nom_trgm ON medicaments USING gin(nom gin_trgm_ops);

-- ============================================================================
-- FIN DE LA MIGRATION
-- ============================================================================

-- Afficher un message de succès
DO $$
BEGIN
  RAISE NOTICE 'Migration terminée avec succès !';
  RAISE NOTICE 'Toutes les tables ont été créées.';
END $$;
