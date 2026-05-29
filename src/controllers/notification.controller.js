/**
 * controllers/notification.controller.js
 */
const { Notification } = require('../models');
const { success, notFound } = require('../utils/apiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { notificationService } = require('../services/notification.service');
const { cacheService } = require('../services/cache.service');

const notificationController = {
  async list(req, res, next) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const where = { id_utilisateur: req.user.id };
      if (req.query.type) where.type = req.query.type;
      if (req.query.lu !== undefined) where.lu = req.query.lu === 'true';

      const { count, rows } = await Notification.findAndCountAll({ where, limit, offset, order: [['createdAt', 'DESC']] });
      return success(res, { notifications: rows, meta: buildMeta(count, page, limit) });
    } catch (err) { next(err); }
  },

  async countNonLues(req, res, next) {
    try {
      const count = await notificationService.countNonLues(req.user.id);
      return success(res, { count });
    } catch (err) { next(err); }
  },

  async marquerLue(req, res, next) {
    try {
      const notif = await notificationService.marquerLue(req.params.id, req.user.id);
      if (!notif) return notFound(res, 'Notification introuvable');
      return success(res, { notification: notif }, 'Notification lue');
    } catch (err) { next(err); }
  },

  async toutLire(req, res, next) {
    try {
      await notificationService.marquerToutesLues(req.user.id);
      return success(res, null, 'Toutes les notifications marquées comme lues');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const notif = await Notification.findOne({ where: { id: req.params.id, id_utilisateur: req.user.id } });
      if (!notif) return notFound(res, 'Notification introuvable');
      await notif.destroy();
      return success(res, null, 'Notification supprimée');
    } catch (err) { next(err); }
  },
};

module.exports = { notificationController };
