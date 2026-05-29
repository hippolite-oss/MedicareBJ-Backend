/**
 * validations/dossier.validation.js
 */
const Joi = require('joi');

const updatePatientSchema = Joi.object({
  groupe_sanguin: Joi.string().valid('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-').optional(),
  allergies: Joi.string().max(2000).optional().allow(''),
  antecedents: Joi.string().max(2000).optional().allow(''),
  poids_kg: Joi.number().min(1).max(500).optional(),
  taille_cm: Joi.number().integer().min(30).max(250).optional(),
  medecin_traitant: Joi.string().max(255).optional().allow(''),
  mutuelle: Joi.string().max(255).optional().allow(''),
});

module.exports = { updatePatientSchema };
