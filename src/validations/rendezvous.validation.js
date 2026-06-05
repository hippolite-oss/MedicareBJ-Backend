/**
 * validations/rendezvous.validation.js
 */
const Joi = require('joi');

const createRdvSchema = Joi.object({
  id_medecin: Joi.string().uuid().required(),
  id_hopital: Joi.string().uuid().optional(),
  date_heure: Joi.date().min('now').required(),
  motif: Joi.string().max(500).optional(),
  duree_minutes: Joi.number().integer().min(15).max(120).optional(),
});

const updateRdvStatutSchema = Joi.object({
  statut: Joi.string().valid('confirme', 'annule').required(),
  motif_annulation: Joi.string().max(500).optional(),
});

const demandePaiementRdvSchema = Joi.object({
  id_medecin: Joi.string().uuid().required(),
  date_heure: Joi.date().min('now').required(),
  motif: Joi.string().max(500).optional(),
  duree_minutes: Joi.number().integer().min(15).max(120).optional(),
});

module.exports = { createRdvSchema, updateRdvStatutSchema, demandePaiementRdvSchema };
