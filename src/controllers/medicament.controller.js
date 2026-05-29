/**
 * controllers/medicament.controller.js
 */
const { medicamentService } = require('../services/medicament.service');
const { success, created, notFound } = require('../utils/apiResponse');

const medicamentController = {
  /**
   * Rechercher des médicaments (autocomplete)
   * GET /api/medicaments/search?q=paracetamol
   */
  async search(req, res, next) {
    try {
      const { q } = req.query;
      if (!q || q.length < 2) {
        return success(res, { medicaments: [] });
      }

      const medicaments = await medicamentService.search(q);
      return success(res, { medicaments });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Obtenir tous les médicaments avec pagination
   * GET /api/medicaments?page=1&limit=50&search=para
   */
  async getAll(req, res, next) {
    try {
      const { page = 1, limit = 50, search = '' } = req.query;
      const result = await medicamentService.getAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search
      });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  },

  /**
   * Obtenir un médicament par ID
   * GET /api/medicaments/:id
   */
  async getById(req, res, next) {
    try {
      const { Medicament } = require('../models');
      const medicament = await Medicament.findByPk(req.params.id);
      
      if (!medicament) {
        return notFound(res, 'Médicament introuvable');
      }

      return success(res, { medicament });
    } catch (err) {
      next(err);
    }
  },

  /**
   * Créer un nouveau médicament
   * POST /api/medicaments
   */
  async create(req, res, next) {
    try {
      const { nom, dosage, forme } = req.body;
      const medicament = await medicamentService.create({ nom, dosage, forme });
      return created(res, { medicament }, 'Médicament créé avec succès');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Mettre à jour un médicament
   * PUT /api/medicaments/:id
   */
  async update(req, res, next) {
    try {
      const medicament = await medicamentService.update(req.params.id, req.body);
      
      if (!medicament) {
        return notFound(res, 'Médicament introuvable');
      }

      return success(res, { medicament }, 'Médicament mis à jour');
    } catch (err) {
      next(err);
    }
  },

  /**
   * Supprimer un médicament
   * DELETE /api/medicaments/:id
   */
  async delete(req, res, next) {
    try {
      const deleted = await medicamentService.delete(req.params.id);
      
      if (!deleted) {
        return notFound(res, 'Médicament introuvable');
      }

      return success(res, null, 'Médicament supprimé');
    } catch (err) {
      next(err);
    }
  }
};

module.exports = { medicamentController };
