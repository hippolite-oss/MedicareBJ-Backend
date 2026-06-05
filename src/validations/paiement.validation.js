/**
 * validations/paiement.validation.js
 */
const Joi = require('joi');
const { isValidTelephoneBJ, normalizeTelephoneBJ } = require('../utils/telephone');

const telephoneBJ = Joi.string().custom((value, helpers) => {
  if (!value) return value;
  if (!isValidTelephoneBJ(value)) {
    return helpers.message('Numéro invalide. Format attendu : +22901XXXXXXXX ou 01XXXXXXXX');
  }
  return normalizeTelephoneBJ(value);
});

const initierPaiementSchema = Joi.object({
  id_paiement: Joi.string().uuid().optional(),
  id_consultation: Joi.string().uuid().optional(),
  id_rdv: Joi.string().uuid().optional(),
  montant: Joi.number().positive().required(),
  mode_paiement: Joi.string().valid('mtn_money', 'moov_money', 'fedapay', 'especes').required(),
  telephone: Joi.when('mode_paiement', {
    is: Joi.valid('mtn_money', 'moov_money'),
    then: telephoneBJ.required(),
    otherwise: telephoneBJ.optional(),
  }),
});

module.exports = { initierPaiementSchema };
