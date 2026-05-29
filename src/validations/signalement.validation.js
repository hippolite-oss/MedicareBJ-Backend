/**
 * validations/signalement.validation.js
 */
const Joi = require('joi');

const createSignalementSchema = Joi.object({
  id_cible: Joi.string().uuid().required(),
  motif: Joi.string().min(10).max(2000).required(),
});

const traiterSignalementSchema = Joi.object({
  decision: Joi.string().valid('avertissement', 'suspension_30j', 'suspension_definitive', 'rejete').required(),
  decision_admin: Joi.string().min(5).max(2000).required(),
});

module.exports = { createSignalementSchema, traiterSignalementSchema };
