/**
 * controllers/audit.controller.js
 */
const { JournalAudit, Utilisateur } = require('../models');
const { success } = require('../utils/apiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { Op } = require('sequelize');

const auditController = {
  async list(req, res, next) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const { id_utilisateur, action, date_debut, date_fin } = req.query;
      const where = {};
      if (id_utilisateur) where.id_utilisateur = id_utilisateur;
      if (action) where.action = action;
      if (date_debut) where.createdAt = { [Op.gte]: new Date(date_debut) };
      if (date_fin) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(date_fin) };

      const { count, rows } = await JournalAudit.findAndCountAll({
        where, limit, offset, order: [['createdAt', 'DESC']],
        include: [{ model: Utilisateur, attributes: ['id', 'nom', 'prenom', 'email', 'role'], required: false }],
      });
      return success(res, { logs: rows, meta: buildMeta(count, page, limit) });
    } catch (err) { next(err); }
  },

  async export(req, res, next) {
    try {
      const { id_utilisateur, action, date_debut, date_fin } = req.query;
      const where = {};
      if (id_utilisateur) where.id_utilisateur = id_utilisateur;
      if (action) where.action = action;
      if (date_debut) where.createdAt = { [Op.gte]: new Date(date_debut) };
      if (date_fin) where.createdAt = { ...where.createdAt, [Op.lte]: new Date(date_fin) };

      const logs = await JournalAudit.findAll({ where, order: [['createdAt', 'DESC']], limit: 10000 });

      const csv = [
        'ID,Utilisateur,Action,IP,Date,Statut',
        ...logs.map((l) => `${l.id},${l.id_utilisateur || ''},${l.action},${l.ip || ''},${l.createdAt.toISOString()},${l.statut}`),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="audit_${Date.now()}.csv"`);
      return res.send('\uFEFF' + csv); // BOM pour Excel
    } catch (err) { next(err); }
  },
};

module.exports = { auditController };
