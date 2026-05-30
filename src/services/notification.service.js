/**
 * services/notification.service.js — Notifications in-app + Socket.io
 */
const { Notification } = require('../models');
const { cacheService } = require('./cache.service');
const logger = require('../utils/logger');

let _io = null;

function setIO(io) { _io = io; }

const notificationService = {
  /**
   * Crée une notification et l'émet via Socket.io
   */
  async creer({ id_utilisateur, type, titre, contenu, lien = null, metadata = null }) {
    try {
      // Vérifier si une notification identique existe déjà (créée dans les 5 dernières secondes)
      const cinqSecondesAvant = new Date(Date.now() - 5000);
      const existante = await Notification.findOne({
        where: {
          id_utilisateur,
          type,
          titre,
          contenu,
          createdAt: { [require('sequelize').Op.gte]: cinqSecondesAvant }
        }
      });

      if (existante) {
        logger.info(`Notification en double évitée pour user ${id_utilisateur}: ${titre}`);
        return existante;
      }

      const notif = await Notification.create({ id_utilisateur, type, titre, contenu, lien, metadata });

      // Émettre via Socket.io
      if (_io) {
        _io.to(`user:${id_utilisateur}`).emit('new_notification', { notification: notif });
        logger.info(`Notification émise via Socket.io pour user ${id_utilisateur}`);
      }

      // Incrémenter compteur Redis
      await cacheService.incr(`notif_count:${id_utilisateur}`, 86400);

      // Émettre mise à jour compteur
      if (_io) {
        const count = await this.countNonLues(id_utilisateur);
        _io.to(`user:${id_utilisateur}`).emit('notification_count_update', { count });
      }

      return notif;
    } catch (err) {
      logger.error('Erreur création notification :', err.message);
    }
  },

  async countNonLues(id_utilisateur) {
    const cacheKey = `notif_count:${id_utilisateur}`;
    const cached = await cacheService.get(cacheKey);
    if (cached !== null) return cached;

    const count = await Notification.count({ where: { id_utilisateur, lu: false } });
    await cacheService.set(cacheKey, count, 60);
    return count;
  },

  async marquerLue(id, id_utilisateur) {
    const notif = await Notification.findOne({ where: { id, id_utilisateur } });
    if (!notif || notif.lu) return notif;
    await notif.update({ lu: true, date_lecture: new Date() });
    await cacheService.del(`notif_count:${id_utilisateur}`);
    return notif;
  },

  async marquerToutesLues(id_utilisateur) {
    await Notification.update(
      { lu: true, date_lecture: new Date() },
      { where: { id_utilisateur, lu: false } }
    );
    await cacheService.del(`notif_count:${id_utilisateur}`);
  },
};

module.exports = { notificationService, setIO };
