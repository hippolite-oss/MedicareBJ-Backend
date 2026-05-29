-- Script de vérification pour diagnostiquer les problèmes d'affichage des médecins
-- Exécutez ce script dans votre base PostgreSQL pour vérifier la configuration

-- 1. Vérifier tous les médecins et leur statut
SELECT 
  u.id,
  u.email,
  u.nom,
  u.prenom,
  u.role,
  u.statut_compte,
  p.id_utilisateur,
  p.specialite,
  p.profil_public,
  p.statut_validation,
  h.nom as hopital
FROM utilisateurs u
LEFT JOIN professionnels p ON p.id_utilisateur = u.id
LEFT JOIN hopitaux h ON h.id = p.id_hopital
WHERE u.role = 'medecin'
ORDER BY u.nom, u.prenom;

-- 2. Compter les médecins par statut
SELECT 
  p.statut_validation,
  p.profil_public,
  COUNT(*) as nombre
FROM professionnels p
JOIN utilisateurs u ON u.id = p.id_utilisateur
WHERE u.role = 'medecin'
GROUP BY p.statut_validation, p.profil_public
ORDER BY p.statut_validation, p.profil_public;

-- 3. Identifier les médecins qui DEVRAIENT être visibles (publics et validés)
SELECT 
  u.id,
  u.nom,
  u.prenom,
  p.specialite,
  h.nom as hopital
FROM utilisateurs u
JOIN professionnels p ON p.id_utilisateur = u.id
LEFT JOIN hopitaux h ON h.id = p.id_hopital
WHERE u.role = 'medecin'
  AND p.profil_public = true
  AND p.statut_validation = 'valide'
  AND u.statut_compte = 'actif';

-- 4. Identifier les problèmes potentiels
SELECT 
  'Médecin sans profil professionnel' as probleme,
  u.id,
  u.email,
  u.nom,
  u.prenom
FROM utilisateurs u
LEFT JOIN professionnels p ON p.id_utilisateur = u.id
WHERE u.role = 'medecin' AND p.id_utilisateur IS NULL

UNION ALL

SELECT 
  'Médecin validé mais compte inactif' as probleme,
  u.id,
  u.email,
  u.nom,
  u.prenom
FROM utilisateurs u
JOIN professionnels p ON p.id_utilisateur = u.id
WHERE u.role = 'medecin' 
  AND p.statut_validation = 'valide'
  AND u.statut_compte != 'actif'

UNION ALL

SELECT 
  'Médecin public mais non validé' as probleme,
  u.id,
  u.email,
  u.nom,
  u.prenom
FROM utilisateurs u
JOIN professionnels p ON p.id_utilisateur = u.id
WHERE u.role = 'medecin' 
  AND p.profil_public = true
  AND p.statut_validation != 'valide';

-- 5. CORRECTION : Activer un médecin pour les tests
-- Décommentez et modifiez l'email ci-dessous pour activer un médecin spécifique
/*
UPDATE professionnels p
SET 
  profil_public = true,
  statut_validation = 'valide'
FROM utilisateurs u
WHERE p.id_utilisateur = u.id
  AND u.email = 'medecin@example.com';  -- Remplacez par l'email du médecin

UPDATE utilisateurs
SET statut_compte = 'actif'
WHERE email = 'medecin@example.com';  -- Remplacez par l'email du médecin
*/

-- 6. Vérifier les consultations passées (pour tester la visibilité des médecins privés)
SELECT 
  p.email as patient_email,
  m.email as medecin_email,
  m.nom as medecin_nom,
  m.prenom as medecin_prenom,
  COUNT(c.id) as nombre_consultations
FROM consultations c
JOIN dossiers_medicaux dm ON dm.id = c.id_dossier
JOIN utilisateurs p ON p.id = dm.id_patient
JOIN utilisateurs m ON m.id = c.id_medecin
GROUP BY p.email, m.email, m.nom, m.prenom
ORDER BY p.email, nombre_consultations DESC;
