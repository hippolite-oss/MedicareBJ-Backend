/**
 * validations/medicament.validation.js
 */
const Joi = require('joi');

const createMedicamentSchema = Joi.object({
  nom: Joi.string().min(2).max(255).required(),
  dosage: Joi.string().min(1).max(100).required(),
  forme: Joi.string().max(100).optional().allow(''),
});

const updateMedicamentSchema = Joi.object({
  nom: Joi.string().min(2).max(255).optional(),
  dosage: Joi.string().min(1).max(100).optional(),
  forme: Joi.string().max(100).optional().allow(''),
});

module.exports = {
  createMedicamentSchema,
  updateMedicamentSchema,
};
