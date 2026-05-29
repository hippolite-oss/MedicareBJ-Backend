/**
 * validations/prescription.validation.js
 */
const Joi = require('joi');

const medicamentSchema = Joi.object({
  nom_medicament: Joi.string().min(2).max(255).required(),
  dosage: Joi.string().min(1).max(100).required(),
  forme: Joi.string().max(100).optional(),
  frequence: Joi.string().min(2).max(200).required(),
  duree_jours: Joi.number().integer().min(1).max(365).optional(),
  instructions: Joi.string().max(500).optional(),
});

const createPrescriptionSchema = Joi.object({
  id_consultation: Joi.string().uuid().required(),
  instructions_generales: Joi.string().max(1000).optional(),
  medicaments: Joi.array().items(medicamentSchema).min(1).required(),
});

module.exports = { createPrescriptionSchema };
