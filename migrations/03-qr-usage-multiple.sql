-- Migration pour permettre l'usage multiple des codes QR
-- Date: 2026-05-18

-- 1. Mettre à jour tous les codes QR avec statut 'utilise' vers 'actif'
--    pour permettre leur réutilisation
UPDATE codes_qr 
SET statut = 'actif' 
WHERE statut = 'utilise';

-- 2. Modifier la colonne statut pour supprimer l'option 'utilise'
--    Note: En PostgreSQL, on ne peut pas modifier directement un ENUM
--    Il faut créer un nouveau type et migrer

-- Créer un nouveau type ENUM sans 'utilise'
CREATE TYPE statut_qr_new AS ENUM ('actif', 'expire', 'revoque');

-- Modifier la colonne pour utiliser le nouveau type
ALTER TABLE codes_qr 
  ALTER COLUMN statut TYPE statut_qr_new 
  USING statut::text::statut_qr_new;

-- Supprimer l'ancien type
DROP TYPE IF EXISTS statut_qr_old CASCADE;

-- 3. Rendre la colonne date_expiration nullable pour les QR à validité illimitée
ALTER TABLE codes_qr 
  ALTER COLUMN date_expiration DROP NOT NULL;

-- 4. Ajouter des commentaires pour documenter les champs obsolètes
COMMENT ON COLUMN codes_qr.utilise_par IS 'Historique: premier utilisateur (obsolète - usage multiple autorisé)';
COMMENT ON COLUMN codes_qr.date_utilisation IS 'Historique: première utilisation (obsolète - usage multiple autorisé)';

-- 5. Créer un index pour améliorer les performances des requêtes d'historique
CREATE INDEX IF NOT EXISTS idx_acces_dossiers_code_qr 
  ON acces_dossiers(id_code_qr) 
  WHERE id_code_qr IS NOT NULL;

-- 6. Ajouter un commentaire sur la table pour documenter le changement
COMMENT ON TABLE codes_qr IS 'Codes QR pour accès temporaire aux dossiers médicaux. Usage multiple autorisé depuis 2026-05-18.';

-- Afficher un résumé des changements
SELECT 
  'Migration terminée' as status,
  COUNT(*) FILTER (WHERE statut = 'actif') as codes_actifs,
  COUNT(*) FILTER (WHERE statut = 'expire') as codes_expires,
  COUNT(*) FILTER (WHERE statut = 'revoque') as codes_revoques,
  COUNT(*) FILTER (WHERE date_expiration IS NULL) as codes_illimites
FROM codes_qr;
