/**
 * validations/paiement.validation.js
 */
const Joi = require('joi');

const initierPaiementSchema = Joi.object({
  id_consultation: Joi.string().uuid().optional(),
  id_rdv: Joi.string().uuid().optional(),
  montant: Joi.number().positive().required(),
  mode_paiement: Joi.string().valid('mtn_money', 'moov_money', 'cinetpay', 'especes').required(),
  telephone: Joi.string().pattern(/^\+?[0-9]{8,15}$/).optional(),
});

module.exports = { initierPaiementSchema };
