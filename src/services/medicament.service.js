/**
 * services/medicament.service.js — Logique métier pour les médicaments
 */
const { Medicament } = require('../models');
const { Op } = require('sequelize');

const medicamentService = {
  /**
   * Rechercher ou créer un médicament
   */
  async findOrCreate({ nom, dosage, forme }) {
    const [medicament, created] = await Medicament.findOrCreate({
      where: { nom, dosage, forme },
      defaults: { nom, dosage, forme }
    });
    return medicament;
  },

  /**
   * Rechercher des médicaments par nom (autocomplete)
   */
  async search(query, limit = 10) {
    return await Medicament.findAll({
      where: {
        nom: { [Op.iLike]: `%${query}%` }
      },
      limit,
      order: [['nom', 'ASC']]
    });
  },

  /**
   * Obtenir tous les médicaments avec pagination
   */
  async getAll({ page = 1, limit = 50, search = '' }) {
    const offset = (page - 1) * limit;
    const where = search ? { nom: { [Op.iLike]: `%${search}%` } } : {};

    const { count, rows } = await Medicament.findAndCountAll({
      where,
      limit,
      offset,
      order: [['nom', 'ASC']]
    });

    return {
      medicaments: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit)
    };
  },

  /**
   * Créer un nouveau médicament
   */
  async create(data) {
    return await Medicament.create(data);
  },

  /**
   * Mettre à jour un médicament
   */
  async update(id, data) {
    const medicament = await Medicament.findByPk(id);
    if (!medicament) return null;
    return await medicament.update(data);
  },

  /**
   * Supprimer un médicament
   */
  async delete(id) {
    const medicament = await Medicament.findByPk(id);
    if (!medicament) return false;
    await medicament.destroy();
    return true;
  }
};

module.exports = { medicamentService };
