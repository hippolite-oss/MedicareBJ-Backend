/**
 * middlewares/acces.middleware.js — Vérification accès dossier médical
 */
const { DossierMedical, AccesDossier } = require('../models');
const { forbidden, notFound } = require('../utils/apiResponse');

/**
 * Vérifie que l'utilisateur a le droit d'accéder au dossier
 * @param {string} typeAcces - 'lecture' | 'ecriture' (défaut: 'lecture')
 */
function verifierAccesDossier(typeAcces = 'lecture') {
  return async (req, res, next) => {
    try {
      const id_dossier = req.params.id || req.params.id_dossier || req.body.id_dossier;
      const user = req.user;

      if (!id_dossier) return forbidden(res, 'Identifiant dossier manquant');

      const dossier = await DossierMedical.findByPk(id_dossier);
      if (!dossier) return notFound(res, 'Dossier médical introuvable');

      // Admin : accès libre
      if (user.role === 'admin') {
        req.dossier = dossier;
        return next();
      }

      // Patient : accès à son propre dossier uniquement
      if (user.role === 'patient' || user.role === 'usager') {
        if (dossier.id_patient !== user.id) {
          return forbidden(res, 'Accès refusé à ce dossier');
        }
        req.dossier = dossier;
        return next();
      }

      // Médecin / Technicien : vérifier AccesDossier actif
      if (user.role === 'medecin' || user.role === 'technicien') {
        const acces = await AccesDossier.findOne({
          where: {
            id_dossier,
            id_professionnel: user.id,
            statut: 'actif',
          },
        });

        if (!acces) return forbidden(res, 'Aucun accès autorisé à ce dossier');

        // Vérifier expiration
        if (acces.date_fin && new Date(acces.date_fin) < new Date()) {
          await acces.update({ statut: 'expire' });
          return forbidden(res, 'Accès expiré');
        }

        // Vérifier type d'accès pour écriture
        if (typeAcces === 'ecriture' && acces.type_acces !== 'ecriture') {
          return forbidden(res, 'Accès en lecture seule');
        }

        req.dossier = dossier;
        req.acces = acces;
        return next();
      }

      return forbidden(res, 'Rôle non autorisé');
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { verifierAccesDossier };
