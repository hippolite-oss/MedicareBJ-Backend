/**
 * validations/auth.validation.js
 */
const Joi = require('joi');

const registerSchema = Joi.object({
  nom: Joi.string().min(2).max(100).required().messages({ 'any.required': 'Le nom est requis' }),
  prenom: Joi.string().min(2).max(100).required().messages({ 'any.required': 'Le prénom est requis' }),
  email: Joi.string().email().required().messages({ 'any.required': 'L\'email est requis' }),
  mot_de_passe: Joi.string().min(8).required().messages({ 'string.min': 'Le mot de passe doit contenir au moins 8 caractères' }),
  telephone: Joi.string().pattern(/^\+?[0-9]{8,15}$/).optional(),
  date_naissance: Joi.date().max('now').optional(),
  sexe: Joi.string().valid('M', 'F', 'autre').optional(),
  role: Joi.string().valid('patient', 'usager').optional(),
});

const registerProSchema = Joi.object({
  nom: Joi.string().min(2).max(100).required(),
  prenom: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  mot_de_passe: Joi.string().min(8).required(),
  telephone: Joi.string().pattern(/^\+?[0-9]{8,15}$/).optional(),
  date_naissance: Joi.date().max('now').optional(),
  sexe: Joi.string().valid('M', 'F', 'autre').optional(),
  role: Joi.string().valid('medecin', 'technicien').required(),
  numero_ordre: Joi.string().min(3).max(100).required(),
  specialite: Joi.string().min(3).max(150).required(),
  id_hopital: Joi.string().uuid().optional(),
  profil_public: Joi.boolean().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  mot_de_passe: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  nouveau_mot_de_passe: Joi.string().min(8).required(),
});

const refreshSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = { registerSchema, registerProSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, refreshSchema };
