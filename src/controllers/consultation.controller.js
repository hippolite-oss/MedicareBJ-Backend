/**
 * controllers/consultation.controller.js
 */
const {
  Consultation,
  DossierMedical,
  Utilisateur,
  Prescription,
  Analyse,
  AccesDossier,
} = require("../models");
const {
  success,
  created,
  notFound,
  forbidden,
} = require("../utils/apiResponse");
const { getPagination, buildMeta } = require("../utils/pagination");
const { notificationService } = require("../services/notification.service");
const { auditService } = require("../services/audit.service");
const { ACTIONS_AUDIT } = require("../utils/constants");
const { Op } = require("sequelize");

const consultationController = {
  async create(req, res, next) {
    try {
      const { id_dossier, ...data } = req.body;

      const dossier = await DossierMedical.findByPk(id_dossier);
      if (!dossier) return notFound(res, "Dossier introuvable");

      const hasAccess = await AccesDossier.findOne({
        where: {
          id_dossier,
          id_professionnel: req.user.id,
          statut: "actif",
        },
      });
      const alreadyConsulted = await Consultation.findOne({
        where: { id_dossier, id_medecin: req.user.id },
      });
      if (!hasAccess && !alreadyConsulted) {
        return forbidden(
          res,
          "Accès insuffisant pour créer une consultation sur ce dossier",
        );
      }

      const consultation = await Consultation.create({
        ...data,
        id_dossier,
        id_medecin: req.user.id,
      });
      await dossier.update({ date_mise_a_jour: new Date() });

      // Notifier le patient
      notificationService
        .creer({
          id_utilisateur: dossier.id_patient,
          type: "consultation",
          titre: "Nouvelle consultation enregistrée",
          contenu: `Dr. ${req.user.prenom} ${req.user.nom} a enregistré une consultation.`,
          lien: `/patient/dossier`,
        })
        .catch(() => {});

      await auditService.log({
        id_utilisateur: req.user.id,
        action: ACTIONS_AUDIT.CREATION_CONSULTATION,
        ip: req.ip,
        details: { id_consultation: consultation.id },
      });

      return created(res, { consultation }, "Consultation créée");
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const consultation = await Consultation.findByPk(req.params.id, {
        include: [
          {
            association: "prescription",
            include: [{ association: "medicaments" }],
          },
          { association: "analyses" },
          { association: "medecin", attributes: ["id", "nom", "prenom"] },
          { association: "hopital", attributes: ["id", "nom"] },
        ],
      });
      if (!consultation) return notFound(res, "Consultation introuvable");
      return success(res, { consultation });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const consultation = await Consultation.findByPk(req.params.id);
      if (!consultation) return notFound(res, "Consultation introuvable");
      if (consultation.id_medecin !== req.user.id)
        return forbidden(res, "Seul le médecin auteur peut modifier");

      // Uniquement dans les 24h
      const diff = Date.now() - new Date(consultation.createdAt).getTime();
      if (diff > 24 * 60 * 60 * 1000)
        return forbidden(res, "Modification impossible après 24h");

      await consultation.update(req.body);
      return success(res, { consultation }, "Consultation mise à jour");
    } catch (err) {
      next(err);
    }
  },

  async mesConsultations(req, res, next) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { date_debut, date_fin, id_patient } = req.query;
      const where = { id_medecin: req.user.id };
      if (date_debut)
        where.date_consultation = { [Op.gte]: new Date(date_debut) };
      if (date_fin)
        where.date_consultation = {
          ...where.date_consultation,
          [Op.lte]: new Date(date_fin),
        };

      const { count, rows } = await Consultation.findAndCountAll({
        where,
        limit,
        offset,
        order: [["date_consultation", "DESC"]],
        include: [
          { association: "hopital", attributes: ["id", "nom"] },
          {
            association: "prescription",
            include: [{ association: "medicaments" }],
          },
          {
            model: DossierMedical,
            as: "dossier",
            attributes: ["id", "numero_dossier"],
            include: [
              {
                association: "patient",
                attributes: [
                  "id",
                  "nom",
                  "prenom",
                  "photo_profil",
                  "date_naissance",
                  "sexe",
                ],
              },
            ],
          },
        ],
      });
      return success(res, {
        consultations: rows,
        meta: buildMeta(count, page, limit),
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { consultationController };
