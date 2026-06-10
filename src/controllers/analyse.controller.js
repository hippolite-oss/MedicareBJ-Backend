/**
 * controllers/analyse.controller.js
 */
const { Analyse, Consultation, DossierMedical } = require("../models");
const {
  success,
  created,
  notFound,
  forbidden,
  badRequest,
} = require("../utils/apiResponse");
const { notificationService } = require("../services/notification.service");
const { auditService } = require("../services/audit.service");
const {
  verifierAccesUtilisateur,
  AccesDossierError,
} = require("../utils/accesDossier");
const { analyseIncludes } = require("../utils/analyseIncludes");

function handleAccesError(err, res, next) {
  if (err instanceof AccesDossierError) {
    if (err.statusCode === 404) return notFound(res, err.message);
    return forbidden(res, err.message);
  }
  return next(err);
}

function analyseAvecResultats(analyse) {
  return Boolean(
    analyse.id_technicien || analyse.resultat || analyse.statut === "disponible",
  );
}

const analyseController = {
  async mesAnalyses(req, res, next) {
    try {
      const { page, limit, offset } =
        require("../utils/pagination").getPagination(req.query);
      const where = { id_medecin_demandeur: req.user.id };
      if (req.query.statut) where.statut = req.query.statut;

      const { count, rows } = await Analyse.findAndCountAll({
        where,
        limit,
        offset,
        order: [["date_demande", "DESC"]],
        include: [
          {
            model: DossierMedical,
            as: "dossier",
            attributes: ["id", "numero_dossier"],
            include: [
              {
                association: "patient",
                attributes: ["id", "nom", "prenom", "photo_profil"],
              },
            ],
          },
          {
            model: Consultation,
            as: "consultation",
            attributes: ["id", "motif", "diagnostic", "date_consultation"],
          },
          ...analyseIncludes,
        ],
      });

      const { buildMeta } = require("../utils/pagination");
      return success(res, {
        analyses: rows,
        meta: buildMeta(count, page, limit),
      });
    } catch (err) {
      next(err);
    }
  },

  async create(req, res, next) {
    try {
      const { id_consultation, id_dossier, type_analyse } = req.body;

      if (!id_dossier || !type_analyse?.trim()) {
        return badRequest(res, "Dossier et type d'analyse requis");
      }

      await verifierAccesUtilisateur(req.user, id_dossier, "ecriture");

      const analyse = await Analyse.create({
        id_consultation: id_consultation || null,
        id_dossier,
        id_medecin_demandeur: req.user.id,
        type_analyse: type_analyse.trim(),
        statut: "demandee",
      });

      const dossier = await DossierMedical.findByPk(id_dossier);
      notificationService
        .creer({
          id_utilisateur: dossier.id_patient,
          type: "analyse",
          titre: "Nouvelle analyse demandée",
          contenu: `Dr. ${req.user.prenom} ${req.user.nom} a demandé une analyse : ${type_analyse}.`,
        })
        .catch(() => {});

      const full = await Analyse.findByPk(analyse.id, {
        include: analyseIncludes,
      });

      return created(res, { analyse: full }, "Analyse demandée");
    } catch (err) {
      return handleAccesError(err, res, next);
    }
  },

  async updateResultats(req, res, next) {
    try {
      const { resultat, interpretation } = req.body;
      const analyse = await Analyse.findByPk(req.params.id);

      if (!analyse) return notFound(res, "Analyse introuvable");
      if (!resultat?.trim()) {
        return badRequest(res, "Le résultat est obligatoire");
      }

      await verifierAccesUtilisateur(req.user, analyse.id_dossier, "ecriture");

      if (analyseAvecResultats(analyse)) {
        return forbidden(
          res,
          "Les résultats ont déjà été renseignés et ne peuvent plus être modifiés",
        );
      }

      let fichier_joint = analyse.fichier_joint;
      if (req.file) {
        const cloudinary = require("../config/cloudinary");
        fichier_joint = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "medicarebi/analyses",
              resource_type: "auto",
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result.secure_url);
            }
          );
          uploadStream.end(req.file.buffer);
        });
      }

      await analyse.update({
        resultat: resultat.trim(),
        interpretation: interpretation?.trim() || null,
        statut: "disponible",
        fichier_joint,
        date_resultat: new Date(),
        id_technicien: req.user.id,
      });

      const dossier = await DossierMedical.findByPk(analyse.id_dossier);
      notificationService
        .creer({
          id_utilisateur: dossier.id_patient,
          type: "analyse",
          titre: "Résultats d'analyse disponibles",
          contenu: `Les résultats de votre analyse ${analyse.type_analyse} sont disponibles.`,
        })
        .catch(() => {});

      if (analyse.id_medecin_demandeur !== req.user.id) {
        notificationService
          .creer({
            id_utilisateur: analyse.id_medecin_demandeur,
            type: "analyse",
            titre: "Résultats d'analyse disponibles",
            contenu: `Les résultats de l'analyse ${analyse.type_analyse} sont disponibles.`,
          })
          .catch(() => {});
      }

      await auditService.log({
        id_utilisateur: req.user.id,
        action: "RESULTATS_ANALYSE",
        ip: req.ip,
        details: { id_analyse: analyse.id },
      });

      const full = await Analyse.findByPk(analyse.id, {
        include: analyseIncludes,
      });

      return success(res, { analyse: full }, "Résultats enregistrés");
    } catch (err) {
      return handleAccesError(err, res, next);
    }
  },

  async getById(req, res, next) {
    try {
      const analyse = await Analyse.findByPk(req.params.id, {
        include: analyseIncludes,
      });
      if (!analyse) return notFound(res, "Analyse introuvable");

      await verifierAccesUtilisateur(req.user, analyse.id_dossier, "lecture");

      return success(res, { analyse });
    } catch (err) {
      return handleAccesError(err, res, next);
    }
  },

  async getFichier(req, res, next) {
    try {
      const analyse = await Analyse.findByPk(req.params.id);
      if (!analyse) return notFound(res, "Analyse introuvable");

      await verifierAccesUtilisateur(req.user, analyse.id_dossier, "lecture");

      if (!analyse.fichier_joint) {
        return notFound(res, "Fichier non disponible");
      }
      // fichier_joint est désormais une URL Cloudinary
      return res.redirect(analyse.fichier_joint);
    } catch (err) {
      return handleAccesError(err, res, next);
    }
  },
};

module.exports = { analyseController };
