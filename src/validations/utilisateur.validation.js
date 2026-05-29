/**
 * validations/utilisateur.validation.js
 */
const Joi = require('joi');

const updateUtilisateurSchema = Joi.object({
  nom: Joi.string().min(2).max(100).optional(),
  prenom: Joi.string().min(2).max(100).optional(),
  telephone: Joi.string().pattern(/^\+?[0-9]{8,15}$/).optional(),
  date_naissance: Joi.date().max('now').optional(),
  sexe: Joi.string().valid('M', 'F', 'autre').optional(),
});

const updateStatutSchema = Joi.object({
  statut: Joi.string().valid('actif', 'suspendu').required(),
});

const updatePasswordSchema = Joi.object({
  mot_de_passe_actuel: Joi.string().required().messages({
    'string.empty': 'Le mot de passe actuel est requis',
    'any.required': 'Le mot de passe actuel est requis',
  }),
  nouveau_mot_de_passe: Joi.string().min(8).required().messages({
    'string.empty': 'Le nouveau mot de passe est requis',
    'string.min': 'Le nouveau mot de passe doit contenir au moins 8 caractères',
    'any.required': 'Le nouveau mot de passe est requis',
  }),
});

module.exports = { updateUtilisateurSchema, updateStatutSchema, updatePasswordSchema };
