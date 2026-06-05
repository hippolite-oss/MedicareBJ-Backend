-- Ajout du mode de paiement FedaPay (PostgreSQL)
-- Exécuter si la table paiements existe déjà avec l'ENUM Sequelize

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_paiements_mode_paiement') THEN
    ALTER TYPE enum_paiements_mode_paiement ADD VALUE IF NOT EXISTS 'fedapay';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
