/**
 * controllers/utilisateur.controller.js
 */
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { Utilisateur, Patient, Professionnel } = require("../models");
const {
  success,
  paginated,
  notFound,
  forbidden,
} = require("../utils/apiResponse");
const { getPagination, buildMeta } = require("../utils/pagination");
const { Op } = require("sequelize");
const { emailService } = require("../services/email.service");
const { auditService } = require("../services/audit.service");
const { ACTIONS_AUDIT } = require("../utils/constants");

const utilisateurController = {
  async list(req, res, next) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { role, statut, search } = req.query;

      const where = {};
      if (role) where.role = role;
      if (statut) where.statut = statut;
      if (search) {
        where[Op.or] = [
          { nom: { [Op.like]: `%${search}%` } },
          { prenom: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ];
      }

      const { count, rows } = await Utilisateur.findAndCountAll({
        where,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
      });
      return paginated(res, rows, buildMeta(count, page, limit));
    } catch (err) {
      next(err);
    }
  },

  async rechercherPatientsAutorises(req, res, next) {
    try {
      const { search } = req.query;
      if (!search || String(search).trim().length < 2) {
        return success(res, { patients: [] });
      }

      const {
        DossierMedical,
        AccesDossier,
        Consultation,
      } = require("../models");
      const term = String(search).trim();

      const acces = await AccesDossier.findAll({
        where: { id_professionnel: req.user.id, statut: "actif" },
        attributes: ["id_dossier"],
        raw: true,
      });
      const consultations = await Consultation.findAll({
        where: { id_medecin: req.user.id },
        attributes: ["id_dossier"],
        raw: true,
      });

      const allowedDossierIds = [
        ...new Set([
          ...acces.map((a) => a.id_dossier),
          ...consultations.map((c) => c.id_dossier),
        ]),
      ];

      if (allowedDossierIds.length === 0) {
        return success(res, { patients: [] });
      }

      const normalized = term.toLowerCase();

      const dossiers = await DossierMedical.findAll({
        where: {
          id: allowedDossierIds,
        },
        include: [
          {
            association: "patient",
            attributes: [
              "id",
              "nom",
              "prenom",
              "email",
              "telephone",
              "photo_profil",
            ],
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      const patients = dossiers
        .filter((d) => {
          const fullName =
            `${d.patient?.prenom || ""} ${d.patient?.nom || ""}`.toLowerCase();
          const reverseFullName =
            `${d.patient?.nom || ""} ${d.patient?.prenom || ""}`.toLowerCase();
          const email = `${d.patient?.email || ""}`.toLowerCase();
          const numeroDossier = `${d.numero_dossier || ""}`.toLowerCase();
          const dossierId = `${d.id || ""}`.toLowerCase();
          const telephone = `${d.patient?.telephone || ""}`.toLowerCase();
          return (
            fullName.includes(normalized) ||
            reverseFullName.includes(normalized) ||
            email.includes(normalized) ||
            telephone.includes(normalized) ||
            numeroDossier.includes(normalized) ||
            numeroDossier === normalized ||
            dossierId === normalized
          );
        })
        .slice(0, 20)
        .map((d) => ({
          id: d.patient.id,
          id_dossier: d.id,
          numero_dossier: d.numero_dossier,
          nom: d.patient.nom,
          prenom: d.patient.prenom,
          email: d.patient.email,
          telephone: d.patient.telephone,
          photo_profil: d.patient.photo_profil,
        }));

      return success(res, { patients });
    } catch (err) {
      next(err);
    }
  },

  // Liste les médecins/techniciens au profil public (messagerie, envoi QR, etc.)
  async listMedecinsPublics(req, res, next) {
    try {
      const { search } = req.query;
      const { Professionnel } = require("../models");

      const where = {
        role: { [Op.in]: ["medecin", "technicien"] },
        statut: "actif",
        id: { [Op.ne]: req.user.id },
      };
      if (search) {
        where[Op.or] = [
          { nom: { [Op.like]: `%${search}%` } },
          { prenom: { [Op.like]: `%${search}%` } },
        ];
      }

      const users = await Utilisateur.findAll({
        where,
        include: [
          {
            model: Professionnel,
            as: "professionnel",
            where: { statut_validation: "valide", profil_public: true },
            required: true,
            attributes: [
              "specialite",
              "profil_public",
              "biographie",
              "tarif_consultation",
            ],
          },
        ],
        attributes: ["id", "nom", "prenom", "role", "photo_profil"],
        order: [["nom", "ASC"]],
        limit: 50,
      });

      return success(res, { medecins: users });
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const user = await Utilisateur.findByPk(req.params.id, {
        include: [
          { association: "patient" },
          {
            association: "professionnel",
            include: [{ association: "hopital" }],
          },
        ],
      });
      if (!user) return notFound(res, "Utilisateur introuvable");
      return success(res, { user });
    } catch (err) {
      next(err);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      // Seul l'utilisateur lui-même ou un admin peut modifier
      if (req.user.role !== "admin" && req.user.id !== id)
        return forbidden(res);

      const user = await Utilisateur.findByPk(id);
      if (!user) return notFound(res, "Utilisateur introuvable");

      await user.update(req.body);
      return success(res, { user }, "Profil mis à jour");
    } catch (err) {
      next(err);
    }
  },

  async updateStatut(req, res, next) {
    try {
      const user = await Utilisateur.findByPk(req.params.id);
      if (!user) return notFound(res, "Utilisateur introuvable");

      await user.update({ statut: req.body.statut });
      emailService
        .send({
          to: user.email,
          subject: "Mise à jour de votre compte MediCare BJ",
          html: `<p>Votre compte a été ${req.body.statut === "actif" ? "réactivé" : "suspendu"}.</p>`,
        })
        .catch(() => {});
      await auditService.log({
        id_utilisateur: req.user.id,
        action: ACTIONS_AUDIT.SUSPENSION_COMPTE,
        ip: req.ip,
        details: { cible: user.id, statut: req.body.statut },
      });

      return success(res, { user }, "Statut mis à jour");
    } catch (err) {
      next(err);
    }
  },

  async uploadAvatar(req, res, next) {
    try {
      if (!req.file)
        return res
          .status(400)
          .json({ success: false, message: "Fichier manquant" });

      const avatarDir = path.join(
        process.env.UPLOAD_PATH || "./uploads",
        "avatars",
      );
      // Créer le dossier si inexistant
      if (!fs.existsSync(avatarDir))
        fs.mkdirSync(avatarDir, { recursive: true });

      const outputPath = path.join(avatarDir, `${req.user.id}.webp`);
      await sharp(req.file.path)
        .resize(200, 200, { fit: "cover" })
        .webp({ quality: 85 })
        .toFile(outputPath);

      // Supprimer le fichier original
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

      const url = `/uploads/avatars/${req.user.id}.webp`;
      await Utilisateur.update(
        { photo_profil: url },
        { where: { id: req.user.id } },
      );

      // Retourner l'utilisateur mis à jour
      const updatedUser = await Utilisateur.findByPk(req.user.id);
      return success(res, { url, user: updatedUser }, "Avatar mis à jour");
    } catch (err) {
      next(err);
    }
  },

  async updateProfilPro(req, res, next) {
    try {
      const { id } = req.params;
      if (req.user.role !== "admin" && req.user.id !== id)
        return forbidden(res);

      const { Professionnel } = require("../models");
      const profil = await Professionnel.findOne({
        where: { id_utilisateur: id },
      });
      if (!profil) return notFound(res, "Profil professionnel introuvable");

      const allowed = ["profil_public", "biographie", "tarif_consultation"];
      const updates = {};
      allowed.forEach((k) => {
        if (req.body[k] !== undefined) updates[k] = req.body[k];
      });

      await profil.update(updates);
      return success(res, { profil }, "Profil professionnel mis à jour");
    } catch (err) {
      next(err);
    }
  },

  async updatePassword(req, res, next) {
    try {
      const { id } = req.params;
      const { mot_de_passe_actuel, nouveau_mot_de_passe } = req.body;

      // Seul l'utilisateur lui-même peut changer son mot de passe
      if (req.user.id !== id) {
        return forbidden(
          res,
          "Vous ne pouvez modifier que votre propre mot de passe",
        );
      }

      // Validation des champs
      if (!mot_de_passe_actuel || !nouveau_mot_de_passe) {
        return res.status(400).json({
          success: false,
          message: "Mot de passe actuel et nouveau mot de passe requis",
        });
      }

      if (nouveau_mot_de_passe.length < 8) {
        return res.status(400).json({
          success: false,
          message:
            "Le nouveau mot de passe doit contenir au moins 8 caractères",
        });
      }

      // Charger l'utilisateur avec le mot de passe (scope withPassword)
      const user = await Utilisateur.scope("withPassword").findByPk(id);
      if (!user) return notFound(res, "Utilisateur introuvable");

      // Vérifier que l'utilisateur a un mot de passe
      if (!user.mot_de_passe) {
        logger.error(
          `Utilisateur ${user.id} (${user.email}) n'a pas de mot de passe défini`,
        );
        return res.status(400).json({
          success: false,
          message:
            'Aucun mot de passe défini pour cet utilisateur. Veuillez utiliser la fonction "Mot de passe oublié" pour en définir un.',
        });
      }

      // Vérifier le mot de passe actuel
      const bcrypt = require("bcrypt");
      let isValid = false;
      try {
        isValid = await bcrypt.compare(mot_de_passe_actuel, user.mot_de_passe);
      } catch (error) {
        logger.error(
          `Erreur bcrypt pour utilisateur ${user.id}: ${error.message}`,
        );
        return res.status(500).json({
          success: false,
          message:
            "Erreur lors de la vérification du mot de passe. Veuillez contacter le support.",
        });
      }

      if (!isValid) {
        return res.status(401).json({
          success: false,
          message: "Mot de passe actuel incorrect",
        });
      }

      // Hasher le nouveau mot de passe
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
      const hashedPassword = await bcrypt.hash(
        nouveau_mot_de_passe,
        saltRounds,
      );

      // Mettre à jour le mot de passe
      await user.update({ mot_de_passe: hashedPassword });

      // Log d'audit
      await auditService.log({
        id_utilisateur: req.user.id,
        action: ACTIONS_AUDIT.MODIFICATION_PROFIL,
        ip: req.ip,
        details: { action: "changement_mot_de_passe" },
      });

      // Envoyer un email de confirmation
      emailService
        .send({
          to: user.email,
          subject: "Mot de passe modifié - MediCare BJ",
          html: `
          <p>Bonjour ${user.prenom} ${user.nom},</p>
          <p>Votre mot de passe a été modifié avec succès.</p>
          <p>Si vous n'êtes pas à l'origine de cette modification, veuillez contacter immédiatement notre support.</p>
          <p>Cordialement,<br>L'équipe MediCare BJ</p>
        `,
        })
        .catch(() => {}); // Ignorer les erreurs d'email

      return success(res, null, "Mot de passe mis à jour avec succès");
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const user = await Utilisateur.findByPk(req.params.id);
      if (!user) return notFound(res, "Utilisateur introuvable");
      // Soft delete : anonymisation RGPD
      await user.update({
        statut: "supprime",
        email: `deleted_${user.id}@deleted.bj`,
        nom: "Supprimé",
        prenom: "Compte",
        telephone: null,
      });
      return success(res, null, "Compte supprimé");
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { utilisateurController };
