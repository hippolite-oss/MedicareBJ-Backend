-- =============================================================
-- fix-telephones.sql
-- Mise à jour des numéros de téléphone vers le nouveau standard
-- béninois : +229 + 10 chiffres (en vigueur depuis janvier 2024)
-- MTN  : préfixes 0196, 0197, 0162, 0163
-- Moov : préfixes 0194, 0195, 0199
-- =============================================================

BEGIN;

-- -------------------------------------------------------------
-- Table : hopitaux
-- -------------------------------------------------------------
UPDATE hopitaux SET telephone = '+2290196000001' WHERE nom = 'CNHU-HKM Cotonou';
UPDATE hopitaux SET telephone = '+2290196000002' WHERE nom = 'CHD Ouémé-Plateau';
UPDATE hopitaux SET telephone = '+2290194000001' WHERE nom = 'CHD Atlantique-Littoral';
UPDATE hopitaux SET telephone = '+2290197000001' WHERE nom = 'Clinique Bénin Médical';
UPDATE hopitaux SET telephone = '+2290195000001' WHERE nom = 'Polyclinique Les Cocotiers';
UPDATE hopitaux SET telephone = '+2290196000003' WHERE nom = 'CHD Borgou-Alibori';

-- -------------------------------------------------------------
-- Table : utilisateurs
-- -------------------------------------------------------------
UPDATE utilisateurs SET telephone = '+2290197000001' WHERE email = 'admin@medicarebi.bj';
UPDATE utilisateurs SET telephone = '+2290197000002' WHERE email = 'patient@medicarebi.bj';
UPDATE utilisateurs SET telephone = '+2290196000001' WHERE email = 'medecin@medicarebi.bj';
UPDATE utilisateurs SET telephone = '+2290194000001' WHERE email = 'technicien@medicarebi.bj';
UPDATE utilisateurs SET telephone = '+2290195000001' WHERE email = 'medecin2@medicarebi.bj';

COMMIT;

-- Vérification après exécution
SELECT nom, telephone FROM hopitaux ORDER BY nom;
SELECT email, telephone FROM utilisateurs ORDER BY email;
