/**
 * controllers/paiement.controller.js
 */
const { Paiement, Utilisateur } = require('../models');
const { paiementService } = require('../services/paiement.service');
const { pdfService } = require('../services/pdf.service');
const { notificationService } = require('../services/notification.service');
const { auditService } = require('../services/audit.service');
const { success, created, notFound, badRequest } = require('../utils/apiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { generateNumeroRecu } = require('../utils/generateNumero');
const { ACTIONS_AUDIT } = require('../utils/constants');
const { Op } = require('sequelize');

const paiementController = {
  async initier(req, res, next) {
    try {
      const { id_consultation, id_rdv, montant, mode_paiement, telephone } = req.body;

      const paiement = await Paiement.create({
        id_patient: req.user.id,
        id_consultation,
        id_rdv,
        montant,
        mode_paiement,
        telephone_paiement: telephone,
        statut: 'en_attente',
      });

      let result = {};

      if (mode_paiement === 'mtn_money') {
        result = await paiementService.initierMTN({ telephone, montant, id_paiement: paiement.id });
        await paiement.update({ reference_externe: result.reference_mtn });
      } else if (mode_paiement === 'moov_money') {
        // Même logique que MTN (via CinetPay comme agrégateur)
        result = await paiementService.initierCinetPay({ montant, id_paiement: paiement.id, email: req.user.email });
      } else if (mode_paiement === 'cinetpay') {
        result = await paiementService.initierCinetPay({ montant, id_paiement: paiement.id, email: req.user.email });
      }

      return created(res, { id_paiement: paiement.id, statut: paiement.statut, ...result }, 'Paiement initié');
    } catch (err) { next(err); }
  },

  async webhookCinetPay(req, res, next) {
    try {
      const signature = req.headers['x-cinetpay-signature'];
      if (!paiementService.verifierSignatureCinetPay(req.body, signature)) {
        return res.status(400).json({ success: false, message: 'Signature invalide' });
      }

      const { transaction_id, status } = req.body;
      const paiement = await Paiement.findByPk(transaction_id);
      if (!paiement) return res.status(404).json({ success: false });

      const statut = status === 'ACCEPTED' ? 'complete' : 'echoue';
      const numero_recu = statut === 'complete' ? generateNumeroRecu() : null;
      await paiement.update({ statut, date_paiement: new Date(), numero_recu });

      if (statut === 'complete') {
        const patient = await Utilisateur.findByPk(paiement.id_patient);
        const pdfBuffer = await pdfService.genererRecu(paiement, patient);
        const pdfUrl = await pdfService.sauvegarder(pdfBuffer, `recu_${numero_recu}.pdf`, 'recus');
        await paiement.update({ pdf_recu_url: pdfUrl });

        notificationService.creer({ id_utilisateur: paiement.id_patient, type: 'paiement', titre: 'Paiement confirmé', contenu: `Votre paiement de ${paiement.montant} FCFA a été confirmé.` }).catch(() => {});
        await auditService.log({ id_utilisateur: paiement.id_patient, action: ACTIONS_AUDIT.PAIEMENT, details: { id_paiement: paiement.id, montant: paiement.montant } });
      }

      return res.json({ success: true });
    } catch (err) { next(err); }
  },

  async webhookMTN(req, res, next) {
    try {
      const signature = req.headers['x-mtn-signature'];
      if (!paiementService.verifierSignatureMTN(req.body, signature)) {
        return res.status(400).json({ success: false, message: 'Signature invalide' });
      }

      const { externalId, status } = req.body;
      const paiement = await Paiement.findByPk(externalId);
      if (!paiement) return res.status(404).json({ success: false });

      const statut = status === 'SUCCESSFUL' ? 'complete' : 'echoue';
      await paiement.update({ statut, date_paiement: new Date() });

      if (statut === 'complete') {
        notificationService.creer({ id_utilisateur: paiement.id_patient, type: 'paiement', titre: 'Paiement MTN confirmé', contenu: `Paiement de ${paiement.montant} FCFA reçu.` }).catch(() => {});
      }

      return res.json({ success: true });
    } catch (err) { next(err); }
  },

  async mesPaiements(req, res, next) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const where = { id_patient: req.user.id };
      if (req.query.statut) where.statut = req.query.statut;

      const { count, rows } = await Paiement.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
      return success(res, { paiements: rows, meta: buildMeta(count, page, limit) });
    } catch (err) { next(err); }
  },

  async getRecu(req, res, next) {
    try {
      const paiement = await Paiement.findByPk(req.params.id);
      if (!paiement) return notFound(res, 'Paiement introuvable');
      if (!paiement.pdf_recu_url) return notFound(res, 'Reçu non disponible');
      return res.sendFile(`.${paiement.pdf_recu_url}`, { root: '.' });
    } catch (err) { next(err); }
  },

  async listAdmin(req, res, next) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const where = {};
      if (req.query.statut) where.statut = req.query.statut;
      if (req.query.mode_paiement) where.mode_paiement = req.query.mode_paiement;
      if (req.query.date_debut) where.createdAt = { [Op.gte]: new Date(req.query.date_debut) };
      if (req.query.date_fin) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(req.query.date_fin) };

      const { count, rows } = await Paiement.findAndCountAll({
        where, limit, offset, order: [['createdAt', 'DESC']],
        include: [{ association: 'patient', attributes: ['id', 'nom', 'prenom', 'email'] }],
      });
      return success(res, { paiements: rows, meta: buildMeta(count, page, limit) });
    } catch (err) { next(err); }
  },
};

module.exports = { paiementController };
