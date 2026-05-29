-- Migration pour supprimer la validité illimitée des codes QR
-- Date: 2026-05-19

-- 1. Mettre à jour tous les codes QR avec date_expiration NULL
--    en leur donnant une expiration de 30 jours (1 mois)
UPDATE codes_qr 
SET date_expiration = NOW() + INTERVAL '30 days'
WHERE date_expiration IS NULL;

-- 2. Rendre la colonne date_expiration obligatoire
ALTER TABLE codes_qr 
  ALTER COLUMN date_expiration SET NOT NULL;

-- 3. Ajouter un commentaire pour documenter le changement
COMMENT ON COLUMN codes_qr.date_expiration IS 'Date d''expiration du code QR (obligatoire). Durées disponibles: 1h, 6h, 24h, 48h, 1 semaine (168h), 1 mois (720h)';

-- Afficher un résumé des changements
SELECT 
  'Migration terminée' as status,
  COUNT(*) as total_codes,
  COUNT(*) FILTER (WHERE date_expiration > NOW()) as codes_valides,
  COUNT(*) FILTER (WHERE date_expiration <= NOW()) as codes_expires
FROM codes_qr;
