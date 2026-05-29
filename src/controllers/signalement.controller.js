/**
 * controllers/signalement.controller.js
 */
const { Signalement, Utilisateur } = require("../models");
const {
  success,
  created,
  notFound,
  badRequest,
} = require("../utils/apiResponse");
const { getPagination, buildMeta } = require("../utils/pagination");
const { notificationService } = require("../services/notification.service");
const { auditService } = require("../services/audit.service");
const { ACTIONS_AUDIT } = require("../utils/constants");
const {
  buildContenuTraitement,
  notifierTousLesAdmins,
} = require("../utils/signalementNotify");

const signalementController = {
  async create(req, res, next) {
    try {
      const { id_cible, motif } = req.body;

      if (id_cible === req.user.id)
        return badRequest(res, "Auto-signalement non autorisé");

      const cible = await Utilisateur.findByPk(id_cible);
      if (!cible) return notFound(res, "Utilisateur cible introuvable");

      const signalement = await Signalement.create({
        id_emetteur: req.user.id,
        id_cible,
        motif,
      });

      await notifierTousLesAdmins({
        titre: "Nouveau signalement",
        contenu: `${req.user.prenom} ${req.user.nom} a signalé ${cible.prenom} ${cible.nom}. Motif : ${motif.slice(0, 120)}${motif.length > 120 ? "…" : ""}`,
        metadata: { id_signalement: signalement.id, id_cible },
      });

      return created(res, { signalement }, "Signalement soumis");
    } catch (err) {
      next(err);
    }
  },

  async countEnAttente(req, res, next) {
    try {
      const count = await Signalement.count({
        where: { statut: "en_attente" },
      });
      return success(res, { count });
    } catch (err) {
      next(err);
    }
  },

  async list(req, res, next) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const where = {};
      if (req.query.statut) where.statut = req.query.statut;

      const { count, rows } = await Signalement.findAndCountAll({
        where,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        include: [
          {
            association: "emetteur",
            attributes: ["id", "nom", "prenom", "role"],
          },
          {
            association: "cible",
            attributes: ["id", "nom", "prenom", "role"],
          },
        ],
      });
      return success(res, {
        signalements: rows,
        meta: buildMeta(count, page, limit),
      });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const signalement = await Signalement.findByPk(req.params.id, {
        include: [
          {
            association: "emetteur",
            attributes: ["id", "nom", "prenom", "email", "role"],
          },
          {
            association: "cible",
            attributes: ["id", "nom", "prenom", "email", "role"],
          },
        ],
      });
      if (!signalement) return notFound(res, "Signalement introuvable");
      return success(res, { signalement });
    } catch (err) {
      next(err);
    }
  },

  async traiter(req, res, next) {
    try {
      const { decision, decision_admin } = req.body;
      const commentaire = decision_admin?.trim();
      const signalement = await Signalement.findByPk(req.params.id, {
        include: [{ association: "cible" }, { association: "emetteur" }],
      });
      if (!signalement) return notFound(res, "Signalement introuvable");

      const statutFinal = decision === "rejete" ? "rejete" : "traite";

      await signalement.update({
        decision,
        decision_admin: commentaire,
        statut: statutFinal,
        traite_par: req.user.id,
        date_traitement: new Date(),
      });

      if (decision === "suspension_30j") {
        await Utilisateur.update(
          { statut: "suspendu" },
          { where: { id: signalement.id_cible } },
        );
      } else if (decision === "suspension_definitive") {
        await Utilisateur.update(
          { statut: "suspendu" },
          { where: { id: signalement.id_cible } },
        );
      }

      const metaNotif = {
        id_signalement: signalement.id,
        decision,
        decision_admin: commentaire,
      };

      const contenuEmetteur = buildContenuTraitement(decision, commentaire);
      await notificationService
        .creer({
          id_utilisateur: signalement.id_emetteur,
          type: "signalement",
          titre: "Votre signalement a été traité",
          contenu: `Votre signalement concernant ${signalement.cible?.prenom} ${signalement.cible?.nom} a été traité.\n\n${contenuEmetteur}`,
          lien: "/patient/notifications",
          metadata: metaNotif,
        })
        .catch(() => {});

      const contenuCible = buildContenuTraitement(decision, commentaire);
      const lienCible =
        signalement.cible?.role === "medecin" ||
        signalement.cible?.role === "technicien"
          ? "/medecin/notifications"
          : "/patient/notifications";

      await notificationService
        .creer({
          id_utilisateur: signalement.id_cible,
          type: "signalement",
          titre: "Décision administrative",
          contenu: contenuCible,
          lien: lienCible,
          metadata: metaNotif,
        })
        .catch(() => {});

      await auditService.log({
        id_utilisateur: req.user.id,
        action: ACTIONS_AUDIT.TRAITEMENT_SIGNALEMENT,
        ip: req.ip,
        details: { id_signalement: signalement.id, decision },
      });

      return success(res, { signalement }, "Signalement traité");
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { signalementController };
