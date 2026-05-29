/**
 * controllers/hopital.controller.js
 */
const { Hopital, Professionnel, Utilisateur } = require('../models');
const { success, created, notFound } = require('../utils/apiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { cacheService } = require('../services/cache.service');
const { Op } = require('sequelize');

const hopitalController = {
  async list(req, res, next) {
    try {
      const cacheKey = `hopitaux:${JSON.stringify(req.query)}`;
      const cached = await cacheService.get(cacheKey);
      if (cached) return success(res, cached);

      const { page, limit, offset } = getPagination(req.query);
      const where = {};
      if (req.query.ville) where.ville = { [Op.like]: `%${req.query.ville}%` };
      if (req.query.type) where.type = req.query.type;
      if (req.query.statut) where.statut = req.query.statut;
      // Ne pas filtrer par statut par défaut pour permettre à l'admin de voir tous les hôpitaux

      const { count, rows } = await Hopital.findAndCountAll({ where, limit, offset, order: [['nom', 'ASC']] });
      const data = { hopitaux: rows, meta: buildMeta(count, page, limit) };

      await cacheService.set(cacheKey, data, 3600); // 1 heure
      return success(res, data);
    } catch (err) { next(err); }
  },

  async getById(req, res, next) {
    try {
      const hopital = await Hopital.findByPk(req.params.id, {
        include: [{
          association: 'professionnels',
          where: { statut_validation: 'valide', profil_public: true },
          required: false,
          include: [{ model: Utilisateur, attributes: ['id', 'nom', 'prenom', 'photo_profil'] }],
        }],
      });
      if (!hopital) return notFound(res, 'Hôpital introuvable');
      return success(res, { hopital });
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      const hopital = await Hopital.create(req.body);
      await cacheService.del('hopitaux:*');
      return created(res, { hopital }, 'Hôpital créé');
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const hopital = await Hopital.findByPk(req.params.id);
      if (!hopital) return notFound(res, 'Hôpital introuvable');
      await hopital.update(req.body);
      await cacheService.del('hopitaux:*');
      return success(res, { hopital }, 'Hôpital mis à jour');
    } catch (err) { next(err); }
  },

  async updateStatut(req, res, next) {
    try {
      const hopital = await Hopital.findByPk(req.params.id);
      if (!hopital) return notFound(res, 'Hôpital introuvable');
      await hopital.update({ statut: req.body.statut });
      await cacheService.del('hopitaux:*');
      return success(res, { hopital }, 'Statut mis à jour');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const hopital = await Hopital.findByPk(req.params.id);
      if (!hopital) return notFound(res, 'Hôpital introuvable');
      await hopital.destroy();
      await cacheService.del('hopitaux:*');
      return success(res, null, 'Hôpital supprimé');
    } catch (err) { next(err); }
  },
};

module.exports = { hopitalController };
