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
const { ACTIONS_AUDIT, MODES_PAIEMENT, TARIF_CONSULTATION_RDV } = require('../utils/constants');
const { creerRdvApresPaiement } = require('../services/rendezvous.service');
const { unwrapFedaPayResource } = require('../utils/fedapay');
const { Op } = require('sequelize');

const MODES_FEDAPAY = [
  MODES_PAIEMENT.FEDAPAY,
  MODES_PAIEMENT.MTN,
  MODES_PAIEMENT.MOOV,
];

async function finaliserPaiementReussi(paiement) {
  if (paiement.statut === 'complete') return paiement;

  const numero_recu = generateNumeroRecu();
  await paiement.update({
    statut: 'complete',
    date_paiement: new Date(),
    numero_recu,
  });

  const patient = await Utilisateur.findByPk(paiement.id_patient);
  const pdfBuffer = await pdfService.genererRecu(paiement, patient);
  const pdfUrl = await pdfService.sauvegarder(pdfBuffer, `recu_${numero_recu}.pdf`, 'recus');
  await paiement.update({ pdf_recu_url: pdfUrl });

  notificationService.creer({
    id_utilisateur: paiement.id_patient,
    type: 'paiement',
    titre: 'Paiement confirmé',
    contenu: `Votre paiement de ${paiement.montant} FCFA a été confirmé.`,
  }).catch(() => {});

  await auditService.log({
    id_utilisateur: paiement.id_patient,
    action: ACTIONS_AUDIT.PAIEMENT,
    details: { id_paiement: paiement.id, montant: paiement.montant },
  });

  if (paiement.metadata?.pending_rdv && !paiement.id_rdv && patient) {
    await creerRdvApresPaiement(paiement, patient);
    await paiement.reload();
  }

  return paiement;
}

async function trouverPaiementDepuisTransactionFedaPay(transaction) {
  const meta = transaction.custom_metadata || {};
  if (meta.id_paiement) {
    const parId = await Paiement.findByPk(meta.id_paiement);
    if (parId) return parId;
  }
  if (transaction.id) {
    return Paiement.findOne({ where: { reference_externe: String(transaction.id) } });
  }
  return null;
}

const paiementController = {
  async initier(req, res, next) {
    try {
      const { id_paiement, id_consultation, id_rdv, montant, mode_paiement, telephone } = req.body;

      let paiement;

      if (id_paiement) {
        paiement = await Paiement.findByPk(id_paiement);
        if (!paiement) return notFound(res, 'Paiement introuvable');
        if (paiement.id_patient !== req.user.id) {
          return res.status(403).json({ success: false, message: 'Accès refusé' });
        }
        if (paiement.statut !== 'en_attente') {
          return badRequest(res, 'Ce paiement n\'est plus en attente');
        }
        if (Number(paiement.montant) !== Number(montant)) {
          return badRequest(res, 'Montant invalide');
        }
        if (paiement.metadata?.type === 'consultation_rdv' && Number(montant) !== TARIF_CONSULTATION_RDV) {
          return badRequest(res, `Le tarif de consultation est fixé à ${TARIF_CONSULTATION_RDV} FCFA`);
        }
        await paiement.update({
          mode_paiement,
          telephone_paiement: telephone,
          id_consultation: id_consultation ?? paiement.id_consultation,
          id_rdv: id_rdv ?? paiement.id_rdv,
        });
      } else {
        paiement = await Paiement.create({
          id_patient: req.user.id,
          id_consultation,
          id_rdv,
          montant,
          mode_paiement,
          telephone_paiement: telephone,
          statut: 'en_attente',
        });
      }

      let result = {};

      if (mode_paiement === MODES_PAIEMENT.ESPECES) {
        result = { statut: 'en_attente', message: 'Paiement en espèces — validation manuelle requise' };
      } else if (MODES_FEDAPAY.includes(mode_paiement)) {
        const client = {
          email: req.user.email,
          nom: req.user.nom,
          prenom: req.user.prenom,
          telephone,
        };

        if ([MODES_PAIEMENT.MTN, MODES_PAIEMENT.MOOV].includes(mode_paiement) && !telephone) {
          return badRequest(res, 'Le numéro de téléphone est requis pour ce mode de paiement');
        }

        const hopitalMeta = paiement.metadata?.hopital;
        const description = hopitalMeta
          ? `Consultation RDV — ${hopitalMeta.nom} (${hopitalMeta.telephone})`
          : 'Paiement MediCare BJ';

        result = await paiementService.initierFedaPay({
          montant,
          id_paiement: paiement.id,
          description,
          ...client,
          modeMobile: [MODES_PAIEMENT.MTN, MODES_PAIEMENT.MOOV].includes(mode_paiement)
            ? mode_paiement
            : undefined,
        });
        await paiement.update({ reference_externe: result.reference_fedapay });
      } else {
        return badRequest(res, 'Mode de paiement non supporté');
      }

      return created(res, { id_paiement: paiement.id, statut: paiement.statut, ...result }, 'Paiement initié');
    } catch (err) { next(err); }
  },

  async webhookFedaPay(req, res, next) {
    try {
      const signature = req.headers['x-fedapay-signature'];
      const rawBody = req.rawBody || req.body;

      let event;
      try {
        event = paiementService.construireEvenementFedaPay(rawBody, signature);
      } catch (err) {
        return res.status(400).json({ success: false, message: `Webhook FedaPay invalide: ${err.message}` });
      }

      const eventName = event.name || event.type;
      const transaction = unwrapFedaPayResource(event.entity) || event.entity;

      if (!transaction) {
        return res.json({ received: true });
      }

      let statut = paiementService.mapStatutFedaPay(transaction.status);

      if (transaction.id && ['transaction.approved', 'transaction.transferred'].includes(eventName)) {
        const txVerifiee = await paiementService.recupererTransactionFedaPay(transaction.id);
        statut = paiementService.mapStatutFedaPay(txVerifiee.status);
        Object.assign(transaction, txVerifiee);
      } else if (['transaction.declined', 'transaction.canceled'].includes(eventName)) {
        statut = 'echoue';
      }

      const paiement = await trouverPaiementDepuisTransactionFedaPay(transaction);
      if (!paiement) return res.status(404).json({ success: false });

      if (statut === 'complete') {
        await finaliserPaiementReussi(paiement);
      } else if (statut === 'echoue' && paiement.statut === 'en_attente') {
        await paiement.update({ statut: 'echoue', date_paiement: new Date() });
      }

      return res.json({ received: true });
    } catch (err) { next(err); }
  },

  async verifierStatut(req, res, next) {
    try {
      const paiement = await Paiement.findByPk(req.params.id);
      if (!paiement) return notFound(res, 'Paiement introuvable');
      if (paiement.id_patient !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Accès refusé' });
      }

      if (paiement.statut === 'complete') {
        return success(res, { id_paiement: paiement.id, statut: paiement.statut });
      }

      if (!MODES_FEDAPAY.includes(paiement.mode_paiement) || !paiement.reference_externe) {
        return success(res, { id_paiement: paiement.id, statut: paiement.statut });
      }

      const transaction = await paiementService.recupererTransactionFedaPay(paiement.reference_externe);
      const statut = paiementService.mapStatutFedaPay(transaction.status);

      if (statut === 'complete') {
        await finaliserPaiementReussi(paiement);
      } else if (statut === 'echoue' && paiement.statut === 'en_attente') {
        await paiement.update({ statut: 'echoue' });
      }

      await paiement.reload();
      return success(res, {
        id_paiement: paiement.id,
        statut: paiement.statut,
        id_rdv: paiement.id_rdv,
        fedapay_status: transaction.status,
      });
    } catch (err) { next(err); }
  },

  async mesPaiements(req, res, next) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const where = { id_patient: req.user.id };
      if (req.query.statut) where.statut = req.query.statut;

      const { count, rows } = await Paiement.findAndCountAll({
        where, limit, offset, order: [['createdAt', 'DESC']],
        include: [{
          association: 'rendezvous',
          attributes: ['id', 'date_heure', 'motif', 'statut'],
          include: [{ association: 'medecin', attributes: ['id', 'nom', 'prenom'] }],
        }],
      });
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
