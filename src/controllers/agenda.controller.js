/**
 * controllers/agenda.controller.js
 */
const { AgendaMedecin } = require('../models');
const { success, created, notFound, forbidden } = require('../utils/apiResponse');
const { Op } = require('sequelize');

const agendaController = {
  async monAgenda(req, res, next) {
    try {
      const { date_debut, date_fin } = req.query;
      const where = { id_medecin: req.user.id };
      if (date_debut) where.date_debut = { [Op.gte]: new Date(date_debut) };
      if (date_fin) where.date_fin = { ...where.date_fin, [Op.lte]: new Date(date_fin) };

      const entrees = await AgendaMedecin.findAll({ where, order: [['date_debut', 'ASC']] });
      return success(res, { agenda: entrees });
    } catch (err) { next(err); }
  },

  async bloquer(req, res, next) {
    try {
      const { date_debut, date_fin, titre, type_entree = 'bloque', notes } = req.body;
      const entree = await AgendaMedecin.create({ id_medecin: req.user.id, date_debut, date_fin, titre, type_entree, notes });
      return created(res, { entree }, 'Créneau bloqué');
    } catch (err) { next(err); }
  },

  async update(req, res, next) {
    try {
      const entree = await AgendaMedecin.findOne({ where: { id: req.params.id, id_medecin: req.user.id } });
      if (!entree) return notFound(res, 'Entrée agenda introuvable');
      await entree.update(req.body);
      return success(res, { entree }, 'Entrée mise à jour');
    } catch (err) { next(err); }
  },

  async delete(req, res, next) {
    try {
      const entree = await AgendaMedecin.findOne({ where: { id: req.params.id, id_medecin: req.user.id } });
      if (!entree) return notFound(res, 'Entrée agenda introuvable');
      if (entree.id_rdv) return forbidden(res, 'Impossible de supprimer une entrée liée à un RDV');
      await entree.destroy();
      return success(res, null, 'Entrée supprimée');
    } catch (err) { next(err); }
  },
};

module.exports = { agendaController };
