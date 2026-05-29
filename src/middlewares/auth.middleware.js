/**
 * middlewares/auth.middleware.js — Vérification JWT
 */
const { verifyAccessToken } = require('../utils/generateToken');
const { unauthorized } = require('../utils/apiResponse');
const { Utilisateur } = require('../models');

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, 'Token d\'authentification manquant');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Vérifier que l'utilisateur existe et est actif
    const user = await Utilisateur.findByPk(decoded.id, {
      attributes: ['id', 'nom', 'prenom', 'email', 'role', 'statut', 'photo_profil'],
    });

    if (!user) return unauthorized(res, 'Utilisateur introuvable');
    if (user.statut !== 'actif') return unauthorized(res, 'Compte inactif ou suspendu');

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') return unauthorized(res, 'Token expiré');
    if (err.name === 'JsonWebTokenError') return unauthorized(res, 'Token invalide');
    next(err);
  }
}

module.exports = { authenticate };
