/**
 * services/notification.service.js — Notifications optimisées
 * - Déduplication des notifications
 * - Émission socket unique (compteur inclus dans le payload)
 * - Cache Redis pour le compteur
 */
const { Notification } = require("../models");
const { cacheService } = require("./cache.service");
const logger = require("../utils/logger");
const { Op } = require("sequelize");

let _io = null;
function setIO(io) {
  _io = io;
}

const notificationService = {
  /**
   * Crée une notification et l'émet via Socket.io
   * Optimisation : une seule émission socket avec compteur inclus
   */
  async creer({
    id_utilisateur,
    type,
    titre,
    contenu,
    lien = null,
    metadata = null,
  }) {
    try {
      // ── Déduplication : éviter les doublons dans les 10 dernières secondes ──
      const dixSecondesAvant = new Date(Date.now() - 10000);
      const existante = await Notification.findOne({
        where: {
          id_utilisateur,
          type,
          titre,
          createdAt: { [Op.gte]: dixSecondesAvant },
        },
        attributes: ["id"],
      });

      if (existante) {
        logger.info(
          `[Notif] Doublon évité pour user ${id_utilisateur}: ${titre}`,
        );
        return existante;
      }

      // ── Création en base ──────────────────────────────────────────────────
      const notif = await Notification.create({
        id_utilisateur,
        type,
        titre,
        contenu,
        lien,
        metadata,
      });

      // ── Incrémenter compteur Redis (sans query DB) ────────────────────────
      const cacheKey = `notif_count:${id_utilisateur}`;
      let newCount;
      try {
        newCount = await cacheService.incr(cacheKey, 86400);
      } catch {
        // Fallback : compter depuis la DB si Redis indisponible
        newCount = await Notification.count({
          where: { id_utilisateur, lu: false },
        });
        await cacheService.set(cacheKey, newCount, 3600);
      }

      // ── Émission socket UNIQUE avec données complètes ─────────────────────
      // Le client peut mettre à jour à la fois la liste ET le compteur en une seule émission
      if (_io) {
        _io.to(`user:${id_utilisateur}`).emit("new_notification", {
          notification: notif,
          unread_count: newCount, // Compteur inclus pour éviter une 2ème émission
        });
        logger.info(
          `[Notif] Émis pour user ${id_utilisateur} — count: ${newCount}`,
        );
      }

      return notif;
    } catch (err) {
      logger.error("[Notif] Erreur création:", err.message);
    }
  },

  async countNonLues(id_utilisateur) {
    const cacheKey = `notif_count:${id_utilisateur}`;
    const cached = await cacheService.get(cacheKey);
    if (cached !== null) return cached;

    const count = await Notification.count({
      where: { id_utilisateur, lu: false },
    });
    await cacheService.set(cacheKey, count, 300); // Cache 5 min
    return count;
  },

  async marquerLue(id, id_utilisateur) {
    const notif = await Notification.findOne({
      where: { id, id_utilisateur },
      attributes: ["id", "lu"],
    });
    if (!notif || notif.lu) return notif;

    await notif.update({ lu: true, date_lecture: new Date() });

    // Décrémenter le compteur Redis
    const cacheKey = `notif_count:${id_utilisateur}`;
    await cacheService.decr(cacheKey);

    // Émettre la mise à jour du compteur
    if (_io) {
      const newCount = await this.countNonLues(id_utilisateur);
      _io
        .to(`user:${id_utilisateur}`)
        .emit("notification_count_update", { count: newCount });
    }

    return notif;
  },

  async marquerToutesLues(id_utilisateur) {
    await Notification.update(
      { lu: true, date_lecture: new Date() },
      { where: { id_utilisateur, lu: false } },
    );
    await cacheService.set(`notif_count:${id_utilisateur}`, 0, 3600);

    if (_io) {
      _io
        .to(`user:${id_utilisateur}`)
        .emit("notification_count_update", { count: 0 });
    }
  },
};

module.exports = { notificationService, setIO };
