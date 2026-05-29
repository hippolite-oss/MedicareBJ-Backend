/**
 * controllers/admin.controller.js
 */
const { Utilisateur, Professionnel, Consultation, Paiement, Signalement, AccesDossier } = require('../models');
const { success, notFound } = require('../utils/apiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { cacheService } = require('../services/cache.service');
const { emailService } = require('../services/email.service');
const { notificationService } = require('../services/notification.service');
const { auditService } = require('../services/audit.service');
const { ACTIONS_AUDIT } = require('../utils/constants');
const { Op, fn, col, literal } = require('sequelize');
const { sequelize } = require('../config/database');

const adminController = {
  async stats(req, res, next) {
    try {
      const cacheKey = 'admin:stats';
      const cached = await cacheService.get(cacheKey);
      if (cached) return success(res, cached);

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const [
        total_patients,
        total_medecins_valides,
        total_inscriptions_attente,
        total_signalements_en_cours,
        revenus_mois,
        nouveaux_inscrits_mois,
      ] = await Promise.all([
        Utilisateur.count({ where: { role: { [Op.in]: ['patient', 'usager'] }, statut: 'actif' } }),
        Utilisateur.count({ where: { role: { [Op.in]: ['medecin', 'technicien'] }, statut: 'actif' } }),
        Utilisateur.count({ where: { statut: 'en_attente' } }),
        Signalement.count({ where: { statut: { [Op.in]: ['en_attente', 'en_cours'] } } }),
        Paiement.sum('montant', { where: { statut: 'complete', createdAt: { [Op.gte]: startOfMonth } } }),
        Utilisateur.count({ where: { createdAt: { [Op.gte]: startOfMonth } } }),
      ]);

      const data = {
        total_patients,
        total_medecins_valides,
        total_inscriptions_attente,
        total_signalements_en_cours,
        revenus_mois_en_cours: revenus_mois || 0,
        nouveaux_inscrits_mois,
      };

      await cacheService.set(cacheKey, data, 300); // 5 minutes
      return success(res, data);
    } catch (err) { next(err); }
  },

  async validationsEnAttente(req, res, next) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { count, rows } = await Utilisateur.findAndCountAll({
        where: { statut: 'en_attente', role: { [Op.in]: ['medecin', 'technicien'] } },
        limit, 
        offset, 
        order: [['createdAt', 'ASC']],
        attributes: [
          'id', 'nom', 'prenom', 'email', 'telephone', 
          'date_naissance', 'sexe', 'role', 'statut', 
          'photo_profil', 'createdAt', 'updatedAt'
        ],
        include: [
          { 
            association: 'professionnel',
            attributes: [
              'id_utilisateur', 'numero_ordre', 'specialite', 
              'profil_public', 'biographie', 'tarif_consultation',
              'statut_validation', 'id_hopital'
            ],
            include: [
              { 
                association: 'hopital',
                attributes: ['id', 'nom', 'ville', 'adresse', 'telephone']
              }
            ]
          }
        ],
      });
      return success(res, { validations: rows, meta: buildMeta(count, page, limit) });
    } catch (err) { 
      console.error('Erreur validationsEnAttente:', err);
      next(err); 
    }
  },

  async validerMedecin(req, res, next) {
    try {
      const user = await Utilisateur.findByPk(req.params.id, { include: [{ association: 'professionnel' }] });
      if (!user) return notFound(res, 'Utilisateur introuvable');

      await user.update({ statut: 'actif' });
      await Professionnel.update(
        { statut_validation: 'valide', date_validation: new Date(), valide_par: req.user.id },
        { where: { id_utilisateur: user.id } }
      );

      emailService.sendValidationCompte(user).catch(() => {});
      notificationService.creer({ id_utilisateur: user.id, type: 'validation', titre: 'Compte validé !', contenu: 'Votre compte professionnel MediCare BJ a été validé. Vous pouvez maintenant vous connecter.' }).catch(() => {});

      await auditService.log({ id_utilisateur: req.user.id, action: ACTIONS_AUDIT.VALIDATION_MEDECIN, ip: req.ip, details: { id_valide: user.id } });

      return success(res, null, 'Compte validé avec succès');
    } catch (err) { next(err); }
  },

  async rejeterMedecin(req, res, next) {
    try {
      const { motif_rejet } = req.body;
      const user = await Utilisateur.findByPk(req.params.id);
      if (!user) return notFound(res, 'Utilisateur introuvable');

      await Professionnel.update({ statut_validation: 'rejete', motif_rejet }, { where: { id_utilisateur: user.id } });

      emailService.sendRejetCompte(user, motif_rejet).catch(() => {});
      notificationService.creer({ id_utilisateur: user.id, type: 'validation', titre: 'Inscription non validée', contenu: `Votre inscription n'a pas été validée. Motif : ${motif_rejet}` }).catch(() => {});

      await auditService.log({ id_utilisateur: req.user.id, action: ACTIONS_AUDIT.REJET_MEDECIN, ip: req.ip, details: { id_rejete: user.id, motif: motif_rejet } });

      return success(res, null, 'Inscription rejetée');
    } catch (err) { next(err); }
  },

  async droitsAcces(req, res, next) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const where = {};
      if (req.query.statut) where.statut = req.query.statut;
      else where.statut = 'actif';

      const { count, rows } = await AccesDossier.findAndCountAll({
        where, limit, offset, order: [['createdAt', 'DESC']],
        include: [{ association: 'professionnel', attributes: ['id', 'nom', 'prenom', 'role'] }],
      });
      return success(res, { acces: rows, meta: buildMeta(count, page, limit) });
    } catch (err) { next(err); }
  },

  async revoquerAcces(req, res, next) {
    try {
      const acces = await AccesDossier.findByPk(req.params.id, { include: [{ association: 'professionnel' }] });
      if (!acces) return notFound(res, 'Accès introuvable');

      await acces.update({ statut: 'revoque' });
      notificationService.creer({ id_utilisateur: acces.id_professionnel, type: 'acces', titre: 'Accès révoqué', contenu: 'Votre accès à un dossier médical a été révoqué par l\'administration.' }).catch(() => {});
      await auditService.log({ id_utilisateur: req.user.id, action: ACTIONS_AUDIT.REVOCATION_ACCES, ip: req.ip, details: { id_acces: acces.id } });

      return success(res, null, 'Accès révoqué');
    } catch (err) { next(err); }
  },
};

module.exports = { adminController };
