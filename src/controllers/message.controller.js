/**
 * controllers/message.controller.js
 */
const path = require("path");
const fs = require("fs");
const {
  Message,
  Utilisateur,
  Consultation,
  AccesDossier,
  Professionnel,
} = require("../models");
const {
  success,
  created,
  forbidden,
  notFound,
  badRequest,
} = require("../utils/apiResponse");
const { getPagination, buildMeta } = require("../utils/pagination");
const { notificationService } = require("../services/notification.service");
const { getIO } = require("../config/socket");
const { Op, fn, col, literal } = require("sequelize");

const messageController = {
  async _hasExistingConversation(userId, otherId) {
    const count = await Message.count({
      where: {
        [Op.or]: [
          { id_expediteur: userId, id_destinataire: otherId },
          { id_expediteur: otherId, id_destinataire: userId },
        ],
      },
    });
    return count > 0;
  },

  async conversations(req, res, next) {
    try {
      const userId = req.user.id;

      // Récupérer tous les messages pour identifier les interlocuteurs uniques
      const messages = await Message.findAll({
        where: {
          [Op.or]: [{ id_expediteur: userId }, { id_destinataire: userId }],
          [Op.and]: [{ supprime_expediteur: false }],
        },
        order: [["createdAt", "DESC"]],
        include: [
          {
            association: "expediteur",
            attributes: ["id", "nom", "prenom", "photo_profil", "role"],
          },
          {
            association: "destinataire",
            attributes: ["id", "nom", "prenom", "photo_profil", "role"],
          },
        ],
      });

      // Grouper par interlocuteur (exclure soi-même)
      const convMap = new Map();
      for (const msg of messages) {
        // Déterminer qui est l'interlocuteur (l'autre personne)
        const isFromMe = msg.id_expediteur === userId;
        const otherId = isFromMe ? msg.id_destinataire : msg.id_expediteur;

        if (otherId === userId) continue; // ignorer les messages à soi-même

        if (!convMap.has(otherId)) {
          // Récupérer l'interlocuteur (toujours l'autre personne, pas moi)
          const interlocuteur = isFromMe ? msg.destinataire : msg.expediteur;

          convMap.set(otherId, {
            interlocuteur: interlocuteur,
            dernier_message: msg,
            non_lus: 0,
          });
        }

        // Compter les messages non lus (reçus par moi)
        if (!msg.lu && msg.id_destinataire === userId) {
          convMap.get(otherId).non_lus++;
        }
      }

      return success(res, { conversations: Array.from(convMap.values()) });
    } catch (err) {
      next(err);
    }
  },

  async conversation(req, res, next) {
    try {
      const userId = req.user.id;
      const otherId = req.params.id_utilisateur;
      const { page, limit, offset } = getPagination(req.query);

      // Vérifier autorisation d'échange
      const canMessage = await messageController._verifierAutorisationMessage(
        userId,
        otherId,
        req.user.role,
      );
      if (!canMessage)
        return forbidden(res, "Échange non autorisé avec cet utilisateur");

      const { count, rows } = await Message.findAndCountAll({
        where: {
          [Op.or]: [
            { id_expediteur: userId, id_destinataire: otherId },
            { id_expediteur: otherId, id_destinataire: userId },
          ],
        },
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        include: [
          {
            association: "expediteur",
            attributes: ["id", "nom", "prenom", "photo_profil"],
          },
        ],
      });

      return success(res, {
        messages: rows,
        meta: buildMeta(count, page, limit),
      });
    } catch (err) {
      next(err);
    }
  },

  async envoyer(req, res, next) {
    try {
      const {
        id_destinataire,
        contenu,
        type_message = "texte",
        media_url = null,
        nom_fichier = null,
        mime_type = null,
        taille_fichier = null,
      } = req.body;
      const userId = req.user.id;

      if (!id_destinataire) return badRequest(res, "Destinataire manquant");
      if (type_message === "texte" && !contenu?.trim())
        return badRequest(res, "Contenu du message manquant");
      if (type_message === "image" && !media_url)
        return badRequest(res, "Média du message manquant");
      if (type_message === "fichier" && !media_url)
        return badRequest(res, "Média du message manquant");
      if (type_message === "qr" && !contenu?.trim() && !media_url)
        return badRequest(res, "Données du QR manquantes");

      const canMessage = await messageController._verifierAutorisationMessage(
        userId,
        id_destinataire,
        req.user.role,
      );
      if (!canMessage)
        return forbidden(res, "Échange non autorisé avec cet utilisateur");

      const message = await Message.create({
        id_expediteur: userId,
        id_destinataire,
        contenu: contenu?.trim() || null,
        type_message,
        media_url,
        nom_fichier,
        mime_type,
        taille_fichier,
      });

      try {
        const io = getIO();
        io.to(`user:${id_destinataire}`).emit("new_message", {
          message,
          expediteur: {
            id: req.user.id,
            nom: req.user.nom,
            prenom: req.user.prenom,
          },
        });
      } catch {}

      return created(res, { message }, "Message envoyé");
    } catch (err) {
      next(err);
    }
  },

  async uploadMedia(req, res, next) {
    try {
      if (!req.file) return badRequest(res, "Fichier manquant");

      const mediaUrl = `/uploads/messages/${req.file.filename}`;
      return created(
        res,
        {
          media_url: mediaUrl,
          nom_fichier: req.file.originalname,
          mime_type: req.file.mimetype,
          taille_fichier: req.file.size,
        },
        "Média uploadé",
      );
    } catch (err) {
      next(err);
    }
  },

  async supprimer(req, res, next) {
    try {
      const message = await Message.findByPk(req.params.id);
      if (!message) return notFound(res, "Message introuvable");

      const isExpediteur = message.id_expediteur === req.user.id;
      const isDestinataire = message.id_destinataire === req.user.id;
      if (!isExpediteur && !isDestinataire)
        return forbidden(res, "Accès refusé");

      const updates = {};
      if (isExpediteur) updates.supprime_expediteur = true;
      if (isDestinataire) updates.supprime_destinataire = true;
      await message.update(updates);

      return success(res, { message }, "Message supprimé");
    } catch (err) {
      next(err);
    }
  },

  async marquerLu(req, res, next) {
    try {
      await Message.update(
        { lu: true, date_lecture: new Date() },
        {
          where: {
            id_expediteur: req.params.id_expediteur,
            id_destinataire: req.user.id,
            lu: false,
          },
        },
      );
      return success(res, null, "Messages marqués comme lus");
    } catch (err) {
      next(err);
    }
  },

  async countNonLus(req, res, next) {
    try {
      const count = await Message.count({
        where: {
          id_destinataire: req.user.id,
          lu: false,
        },
      });
      return success(res, { count });
    } catch (err) {
      next(err);
    }
  },

  async _verifierAutorisationMessage(userId, otherId, userRole) {
    // Pas de message à soi-même
    if (userId === otherId) {
      console.log("[AUTH] Rejet: message à soi-même");
      return false;
    }

    const other = await Utilisateur.findByPk(otherId, {
      include: [
        {
          model: Professionnel,
          as: "professionnel",
          required: false,
          attributes: ["profil_public", "statut_validation"],
        },
      ],
    });

    if (!other) {
      console.log(
        "[AUTH] Rejet: utilisateur destinataire introuvable",
        otherId,
      );
      return false;
    }

    // Toujours autoriser si une conversation existe déjà entre les deux utilisateurs.
    // Cela évite les blocages 403 sur l'ouverture/réponse d'un fil déjà créé.
    const hasExistingConversation =
      await messageController._hasExistingConversation(userId, otherId);
    if (hasExistingConversation) {
      console.log("[AUTH] Autorisé: conversation existante");
      return true;
    }

    // Patient/usager → médecin ou technicien avec profil public actif uniquement
    if (userRole === "patient" || userRole === "usager") {
      if (other.role !== "medecin" && other.role !== "technicien") {
        console.log("[AUTH] Rejet: destinataire n'est pas médecin/technicien", {
          role: other.role,
        });
        return false;
      }

      const pp = other.professionnel;
      if (!pp) {
        console.log(
          "[AUTH] Rejet: professionnel relation manquante pour",
          otherId,
        );
        return false;
      }

      console.log("[AUTH] Vérification professionnel:", {
        id: otherId,
        profil_public: pp.profil_public,
        statut_validation: pp.statut_validation,
      });

      const isAuthorized =
        pp.profil_public === true && pp.statut_validation === "valide";
      if (!isAuthorized) {
        console.log("[AUTH] Rejet: profil non public ou non validé");
      }
      return isAuthorized;
    }

    // Médecin/technicien → patient/usager (toujours autorisé)
    // Médecin/technicien → médecin/technicien si profil public + validé
    if (userRole === "medecin" || userRole === "technicien") {
      if (other.role === "patient" || other.role === "usager") {
        console.log("[AUTH] Professionnel→Patient/Usager: autorisé");
        return true;
      }

      if (other.role === "medecin" || other.role === "technicien") {
        const pp = other.professionnel;
        if (!pp) {
          console.log(
            "[AUTH] Rejet: relation professionnel manquante pour",
            otherId,
          );
          return false;
        }

        const isAuthorized =
          pp.profil_public === true && pp.statut_validation === "valide";
        console.log("[AUTH] Professionnel→Professionnel:", {
          id: otherId,
          profil_public: pp.profil_public,
          statut_validation: pp.statut_validation,
          autorise: isAuthorized,
        });
        return isAuthorized;
      }

      console.log(
        "[AUTH] Rejet: rôle destinataire non autorisé pour professionnel",
        { role: other.role },
      );
      return false;
    }

    // Admin peut tout
    if (userRole === "admin") {
      console.log("[AUTH] Admin: autorisé");
      return true;
    }

    console.log("[AUTH] Rejet: aucune règle ne correspond");
    return false;
  },
};

module.exports = { messageController };
