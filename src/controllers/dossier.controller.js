/**
 * controllers/dossier.controller.js
 */
const {
  DossierMedical,
  Patient,
  Consultation,
  Prescription,
  Analyse,
  Utilisateur,
  AccesDossier,
} = require("../models");
const { success, notFound } = require("../utils/apiResponse");
const { getPagination, buildMeta } = require("../utils/pagination");
const { auditService } = require("../services/audit.service");
const { ACTIONS_AUDIT } = require("../utils/constants");
const { Op } = require("sequelize");
const { analyseIncludes } = require("../utils/analyseIncludes");

const dossierController = {
  async monDossier(req, res, next) {
    try {
      const dossier = await DossierMedical.findOne({
        where: { id_patient: req.user.id },
        include: [
          {
            association: "patient",
            attributes: ["id", "nom", "prenom", "date_naissance", "sexe"],
            include: [{ model: Patient, as: "patient" }],
          },
          {
            association: "consultations",
            limit: 5,
            order: [["date_consultation", "DESC"]],
            include: [
              { association: "medecin", attributes: ["id", "nom", "prenom"] },
            ],
          },
          {
            association: "prescriptions",
            limit: 5,
            order: [["createdAt", "DESC"]],
            include: [
              {
                association: "medecin",
                attributes: ["id", "nom", "prenom"],
                include: [{ association: "professionnel", attributes: ["specialite", "numero_ordre"] }]
              }
            ],
          },
          {
            association: "analyses",
            limit: 5,
            order: [["date_demande", "DESC"]],
            include: analyseIncludes,
          },
        ],
      });

      if (!dossier) return notFound(res, "Dossier médical introuvable");
      return success(res, { dossier });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const dossier = await DossierMedical.findByPk(req.dossier.id, {
        include: [
          {
            association: "patient",
            attributes: [
              "id",
              "nom",
              "prenom",
              "email",
              "telephone",
              "date_naissance",
              "sexe",
              "photo_profil",
            ],
            include: [{ model: Patient, as: "patient" }],
          },
          {
            association: "consultations",
            include: [
              { association: "medecin", attributes: ["id", "nom", "prenom"] },
              { association: "hopital", attributes: ["id", "nom"] },
              {
                association: "prescription",
                include: [{ association: "medicaments" }],
              },
            ],
            order: [["date_consultation", "DESC"]],
          },
          {
            association: "prescriptions",
            include: [
              { association: "medicaments" },
              {
                association: "medecin",
                attributes: ["id", "nom", "prenom"],
                include: [{ association: "professionnel", attributes: ["specialite", "numero_ordre"] }]
              }
            ],
          },
          {
            association: "analyses",
            include: analyseIncludes,
            order: [["date_demande", "DESC"]],
          },
        ],
      });
      await auditService.log({
        id_utilisateur: req.user.id,
        action: ACTIONS_AUDIT.ACCES_DOSSIER,
        ip: req.ip,
        details: { id_dossier: dossier.id },
      });
      return success(res, {
        dossier,
        acces: req.acces
          ? { type_acces: req.acces.type_acces, date_fin: req.acces.date_fin }
          : null,
      });
    } catch (err) {
      next(err);
    }
  },

  async getConsultations(req, res, next) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { date_debut, date_fin, id_medecin } = req.query;
      const where = { id_dossier: req.params.id };
      if (date_debut)
        where.date_consultation = { [Op.gte]: new Date(date_debut) };
      if (date_fin)
        where.date_consultation = {
          ...where.date_consultation,
          [Op.lte]: new Date(date_fin),
        };
      if (id_medecin) where.id_medecin = id_medecin;

      const { count, rows } = await Consultation.findAndCountAll({
        where,
        limit,
        offset,
        order: [["date_consultation", "DESC"]],
        include: [
          { association: "medecin", attributes: ["id", "nom", "prenom"] },
          { association: "hopital", attributes: ["id", "nom"] },
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

  async getPrescriptions(req, res, next) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const where = { id_dossier: req.params.id };
      if (req.query.statut) where.statut = req.query.statut;

      const { count, rows } = await Prescription.findAndCountAll({
        where,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        include: [
          { association: "medicaments" },
          {
            association: "medecin",
            attributes: ["id", "nom", "prenom"],
            include: [{ association: "professionnel", attributes: ["specialite", "numero_ordre"] }]
          }
        ],
      });
      return success(res, {
        prescriptions: rows,
        meta: buildMeta(count, page, limit),
      });
    } catch (err) {
      next(err);
    }
  },

  async getAnalyses(req, res, next) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const where = { id_dossier: req.params.id };
      if (req.query.statut) where.statut = req.query.statut;

      const { count, rows } = await Analyse.findAndCountAll({
        where,
        limit,
        offset,
        order: [["date_demande", "DESC"]],
        include: analyseIncludes,
      });
      return success(res, {
        analyses: rows,
        meta: buildMeta(count, page, limit),
      });
    } catch (err) {
      next(err);
    }
  },

  async mesPatients(req, res, next) {
    try {
      // Récupérer tous les dossiers auxquels le médecin a accès (AccesDossier actif)
      const accesActifs = await AccesDossier.findAll({
        where: { id_professionnel: req.user.id, statut: "actif" },
        attributes: ["id_dossier"],
        raw: true,
      });

      // Récupérer tous les dossiers que le médecin a déjà consultés
      const consultations = await Consultation.findAll({
        where: { id_medecin: req.user.id },
        attributes: ["id_dossier", "date_consultation"],
        raw: true,
      });

      // Union des deux sources de dossiers
      const allDossierIds = [
        ...new Set([
          ...accesActifs.map((a) => a.id_dossier),
          ...consultations.map((c) => c.id_dossier),
        ]),
      ];

      if (allDossierIds.length === 0) {
        return success(res, { patients: [] });
      }

      const dossiers = await DossierMedical.findAll({
        where: { id: allDossierIds },
        attributes: ["id", "numero_dossier", "date_mise_a_jour"],
        include: [
          {
            association: "patient",
            attributes: [
              "id",
              "nom",
              "prenom",
              "photo_profil",
              "sexe",
              "date_naissance",
              "email",
              "telephone",
            ],
          },
        ],
        order: [["date_mise_a_jour", "DESC"]],
      });

      // Calculer derniere consultation + nb consultations par dossier
      const consultParDossier = {};
      consultations.forEach((c) => {
        if (!consultParDossier[c.id_dossier]) {
          consultParDossier[c.id_dossier] = { count: 0, derniere: null };
        }
        consultParDossier[c.id_dossier].count += 1;
        const d = new Date(c.date_consultation);
        if (
          !consultParDossier[c.id_dossier].derniere ||
          d > new Date(consultParDossier[c.id_dossier].derniere)
        ) {
          consultParDossier[c.id_dossier].derniere = c.date_consultation;
        }
      });

      const patients = dossiers.map((d) => ({
        id_dossier: d.id,
        numero_dossier: d.numero_dossier,
        patient: d.patient,
        nb_consultations: consultParDossier[d.id]?.count ?? 0,
        derniere_consultation: consultParDossier[d.id]?.derniere ?? null,
        acces_actif: accesActifs.some((a) => a.id_dossier === d.id),
      }));

      return success(res, { patients });
    } catch (err) {
      next(err);
    }
  },

  async updateProfilMedical(req, res, next) {
    try {
      const dossier = req.dossier;
      let profil = await Patient.findOne({
        where: { id_utilisateur: dossier.id_patient },
      });
      if (!profil)
        profil = await Patient.create({ id_utilisateur: dossier.id_patient });

      await profil.update(req.body);
      await dossier.update({ date_mise_a_jour: new Date() });
      await auditService.log({
        id_utilisateur: req.user.id,
        action: ACTIONS_AUDIT.MODIFICATION_DOSSIER,
        ip: req.ip,
        details: { id_dossier: dossier.id },
      });

      return success(res, { profil }, "Profil médical mis à jour");
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { dossierController };
