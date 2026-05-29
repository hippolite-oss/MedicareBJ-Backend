/**
 * controllers/qrcode.controller.js
 */
const {
  DossierMedical,
  CodeQR,
  Utilisateur,
  AccesDossier,
} = require("../models");
const { qrcodeService } = require("../services/qrcode.service");
const { notificationService } = require("../services/notification.service");
const { auditService } = require("../services/audit.service");
const {
  success,
  created,
  notFound,
  forbidden,
  badRequest,
} = require("../utils/apiResponse");
const { getPagination, buildMeta } = require("../utils/pagination");
const { ACTIONS_AUDIT } = require("../utils/constants");

const qrcodeController = {
  async generer(req, res, next) {
    try {
      const { duree_heures = 24, type_acces = "lecture" } = req.body;

      const dossier = await DossierMedical.findOne({
        where: { id_patient: req.user.id },
      });
      if (!dossier) return notFound(res, "Dossier médical introuvable");

      const result = await qrcodeService.genererQR({
        id_patient: req.user.id,
        id_dossier: dossier.id,
        duree_heures,
        type_acces,
      });

      return created(
        res,
        {
          id: result.codeQR.id,
          token: result.token,
          qrImage: result.qrImage,
          date_expiration: result.date_expiration,
          type_acces,
        },
        "Code QR généré",
      );
    } catch (err) {
      next(err);
    }
  },

  async mesCodes(req, res, next) {
    try {
      const dossier = await DossierMedical.findOne({
        where: { id_patient: req.user.id },
      });
      if (!dossier) return notFound(res, "Dossier introuvable");

      const { page, limit, offset } = getPagination(req.query);
      const where = { id_patient: req.user.id };
      if (req.query.statut) where.statut = req.query.statut;

      const { count, rows } = await CodeQR.findAndCountAll({
        where,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        attributes: [
          "id",
          "token",
          "type_acces",
          "statut",
          "date_expiration",
          "createdAt",
        ],
      });
      return success(res, { codes: rows, meta: buildMeta(count, page, limit) });
    } catch (err) {
      next(err);
    }
  },

  async historiqueScans(req, res, next) {
    try {
      const codeQR = await CodeQR.findOne({
        where: { id: req.params.id, id_patient: req.user.id },
      });
      if (!codeQR) return notFound(res, "Code QR introuvable");

      // Récupérer tous les accès créés via ce QR
      const acces = await AccesDossier.findAll({
        where: { id_code_qr: codeQR.id },
        include: [
          {
            model: Utilisateur,
            as: "professionnel",
            attributes: ["id", "nom", "prenom", "email", "role"],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      return success(res, {
        qr: {
          id: codeQR.id,
          type_acces: codeQR.type_acces,
          statut: codeQR.statut,
          date_expiration: codeQR.date_expiration,
          createdAt: codeQR.createdAt,
        },
        scans: acces.map((a) => ({
          id: a.id,
          professionnel: a.professionnel,
          type_acces: a.type_acces,
          statut: a.statut,
          date_debut: a.date_debut,
          date_fin: a.date_fin,
          createdAt: a.createdAt,
        })),
        total_scans: acces.length,
      });
    } catch (err) {
      next(err);
    }
  },

  async scanner(req, res, next) {
    try {
      const { token } = req.body;
      if (!token) return badRequest(res, "Token QR manquant");

      const { codeQR, decoded } = await qrcodeService.validerQR(token);
      const acces = await qrcodeService.utiliserQR(codeQR, req.user.id);

      // Récupérer infos patient
      const patient = await Utilisateur.findByPk(codeQR.id_patient, {
        attributes: ["id", "nom", "prenom", "date_naissance", "sexe"],
      });

      await auditService.log({
        id_utilisateur: req.user.id,
        action: ACTIONS_AUDIT.SCAN_QR,
        ip: req.ip,
        details: {
          id_dossier: codeQR.id_dossier,
          id_patient: codeQR.id_patient,
        },
      });

      return success(
        res,
        {
          id_dossier: codeQR.id_dossier,
          type_acces: codeQR.type_acces,
          patient_info: patient,
          acces_id: acces.id,
        },
        "Code QR validé. Accès accordé.",
      );
    } catch (err) {
      if (
        err.name === "JsonWebTokenError" ||
        err.name === "TokenExpiredError"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Code QR invalide ou expiré",
            code: "INVALID_QR",
          });
      }
      next(err);
    }
  },

  async revoquer(req, res, next) {
    try {
      const codeQR = await CodeQR.findOne({
        where: { id: req.params.id, id_patient: req.user.id },
      });
      if (!codeQR) return notFound(res, "Code QR introuvable");
      if (codeQR.statut === "revoque")
        return badRequest(res, "Code QR déjà révoqué");

      await codeQR.update({ statut: "revoque" });

      // Invalider l'AccesDossier associé
      await AccesDossier.update(
        { statut: "revoque" },
        { where: { id_code_qr: codeQR.id, statut: "actif" } },
      );

      return success(res, null, "Code QR révoqué");
    } catch (err) {
      next(err);
    }
  },

  async supprimer(req, res, next) {
    try {
      const codeQR = await CodeQR.findOne({
        where: { id: req.params.id, id_patient: req.user.id },
      });
      if (!codeQR) return notFound(res, "Code QR introuvable");

      // Supprimer les accès associés
      await AccesDossier.destroy({ where: { id_code_qr: codeQR.id } });

      // Supprimer le code QR
      await codeQR.destroy();

      return success(res, null, "Code QR supprimé");
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { qrcodeController };
