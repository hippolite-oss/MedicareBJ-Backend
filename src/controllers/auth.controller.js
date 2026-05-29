/**
 * controllers/auth.controller.js
 */
const { authService } = require('../services/auth.service');
const { success, created, badRequest } = require('../utils/apiResponse');
const { Utilisateur, Patient, Professionnel } = require('../models');

const authController = {
  async register(req, res, next) {
    try {
      const result = await authService.register(req.body);
      return created(res, result, 'Compte créé avec succès');
    } catch (err) { next(err); }
  },

  async registerPro(req, res, next) {
    try {
      const result = await authService.registerPro(req.body);
      return created(res, result, 'Inscription soumise. En attente de validation.');
    } catch (err) { next(err); }
  },

  async login(req, res, next) {
    try {
      const result = await authService.login({
        ...req.body,
        ip: req.ip,
        user_agent: req.get('User-Agent'),
      });
      return success(res, result, 'Connexion réussie');
    } catch (err) { next(err); }
  },

  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) return badRequest(res, 'Refresh token manquant');
      const result = await authService.refresh(refreshToken);
      return success(res, result, 'Token renouvelé');
    } catch (err) { next(err); }
  },

  async logout(req, res, next) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken, req.user?.id, req.ip, req.get('User-Agent'));
      return success(res, null, 'Déconnexion réussie');
    } catch (err) { next(err); }
  },

  async forgotPassword(req, res, next) {
    try {
      await authService.forgotPassword(req.body.email);
      return success(res, null, 'Si ce compte existe, un email de réinitialisation a été envoyé');
    } catch (err) { next(err); }
  },

  async resetPassword(req, res, next) {
    try {
      await authService.resetPassword(req.body.token, req.body.nouveau_mot_de_passe);
      return success(res, null, 'Mot de passe mis à jour avec succès');
    } catch (err) { next(err); }
  },

  async me(req, res, next) {
    try {
      const user = await Utilisateur.findByPk(req.user.id, {
        include: [
          { association: 'patient' },
          { association: 'professionnel', include: [{ association: 'hopital' }] },
        ],
      });
      return success(res, { user });
    } catch (err) { next(err); }
  },
};

module.exports = { authController };
