/**
 * controllers/acces.controller.js
 */
const { AccesDossier, DossierMedical, Utilisateur, JournalAudit } = require('../models');
const { success, created, notFound, forbidden } = require('../utils/apiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { notificationService } = require('../services/notification.service');
const { auditService } = require('../services/audit.service');
const { ACTIONS_AUDIT } = require('../utils/constants');
const { addDays } = require('../utils/formatDate');
const { Op } = require('sequelize');

const accesController = {
  async monDossierAcces(req, res, next) {
    try {
      const dossier = await DossierMedical.findOne({ where: { id_patient: req.user.id } });
      if (!dossier) return notFound(res, 'Dossier introuvable');

      const acces = await AccesDossier.findAll({
        where: { id_dossier: dossier.id },
        include: [{ association: 'professionnel', attributes: ['id', 'nom', 'prenom', 'role', 'photo_profil'], include: [{ association: 'professionnel', attributes: ['specialite'] }] }],
        order: [['createdAt', 'DESC']],
      });
      return success(res, { acces });
    } catch (err) { next(err); }
  },

  async accorder(req, res, next) {
    try {
      const { id_professionnel, type_acces = 'lecture', duree_jours } = req.body;

      const dossier = await DossierMedical.findOne({ where: { id_patient: req.user.id } });
      if (!dossier) return notFound(res, 'Dossier introuvable');

      const professionnel = await Utilisateur.findByPk(id_professionnel);
      if (!professionnel || !['medecin', 'technicien'].includes(professionnel.role)) {
        return notFound(res, 'Professionnel introuvable');
      }

      const date_fin = duree_jours ? addDays(new Date(), duree_jours) : null;
      const acces = await AccesDossier.create({ id_dossier: dossier.id, id_professionnel, type_acces, date_fin, source: 'manuel' });

      notificationService.creer({ id_utilisateur: id_professionnel, type: 'acces', titre: 'Accès dossier accordé', contenu: `${req.user.prenom} ${req.user.nom} vous a accordé l'accès à son dossier médical.` }).catch(() => {});

      return created(res, { acces }, 'Accès accordé');
    } catch (err) { next(err); }
  },

  async revoquer(req, res, next) {
    try {
      const acces = await AccesDossier.findByPk(req.params.id, {
        include: [{ association: 'professionnel' }],
      });
      if (!acces) return notFound(res, 'Accès introuvable');

      // Vérifier que c'est le patient propriétaire ou un admin
      const dossier = await DossierMedical.findByPk(acces.id_dossier);
      if (req.user.role !== 'admin' && dossier.id_patient !== req.user.id) return forbidden(res);

      await acces.update({ statut: 'revoque' });
      notificationService.creer({ id_utilisateur: acces.id_professionnel, type: 'acces', titre: 'Accès révoqué', contenu: 'Votre accès à un dossier médical a été révoqué.' }).catch(() => {});
      await auditService.log({ id_utilisateur: req.user.id, action: ACTIONS_AUDIT.REVOCATION_ACCES, ip: req.ip, details: { id_acces: acces.id } });

      return success(res, null, 'Accès révoqué');
    } catch (err) { next(err); }
  },

  async journal(req, res, next) {
    try {
      const dossier = await DossierMedical.findOne({ where: { id_patient: req.user.id } });
      if (!dossier) return notFound(res, 'Dossier introuvable');

      const { page, limit, offset } = getPagination(req.query);
      const { count, rows } = await JournalAudit.findAndCountAll({
        where: { action: ACTIONS_AUDIT.ACCES_DOSSIER, details: { id_dossier: dossier.id } },
        limit, offset, order: [['createdAt', 'DESC']],
        include: [{ model: Utilisateur, attributes: ['id', 'nom', 'prenom', 'role'], required: false }],
      });
      return success(res, { journal: rows, meta: buildMeta(count, page, limit) });
    } catch (err) { next(err); }
  },
};

module.exports = { accesController };
