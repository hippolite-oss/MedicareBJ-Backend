/**
 * validations/consultation.validation.js
 */
const Joi = require('joi');

const createConsultationSchema = Joi.object({
  id_dossier: Joi.string().uuid().required(),
  id_hopital: Joi.string().uuid().optional(),
  id_rdv: Joi.string().uuid().optional(),
  motif: Joi.string().min(3).max(1000).required(),
  diagnostic: Joi.string().max(2000).optional(),
  observations: Joi.string().max(2000).optional(),
  tension_arterielle: Joi.string().max(20).optional(),
  temperature: Joi.number().min(30).max(45).optional(),
  poids_jour: Joi.number().min(1).max(500).optional(),
  type_consultation: Joi.string().valid('presentiel', 'teleconsultation').optional(),
});

const updateConsultationSchema = Joi.object({
  motif: Joi.string().min(3).max(1000).optional(),
  diagnostic: Joi.string().max(2000).optional(),
  observations: Joi.string().max(2000).optional(),
  tension_arterielle: Joi.string().max(20).optional(),
  temperature: Joi.number().min(30).max(45).optional(),
  poids_jour: Joi.number().min(1).max(500).optional(),
  statut: Joi.string().valid('en_cours', 'terminee', 'annulee').optional(),
});

module.exports = { createConsultationSchema, updateConsultationSchema };
