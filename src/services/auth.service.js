/**
 * services/auth.service.js — Logique métier authentification
 */
const {
  Utilisateur,
  Patient,
  Professionnel,
  DossierMedical,
  RefreshToken,
} = require("../models");
const { hashPassword, comparePassword } = require("../utils/hashPassword");
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateResetToken,
  hashResetToken,
} = require("../utils/generateToken");
const { generateNumeroDossier } = require("../utils/generateNumero");
const { emailService } = require("./email.service");
const { notificationService } = require("./notification.service");
const { auditService } = require("./audit.service");
const { ACTIONS_AUDIT } = require("../utils/constants");
const logger = require("../utils/logger");

const authService = {
  /**
   * Inscription patient/usager
   */
  async register({
    nom,
    prenom,
    date_naissance,
    sexe,
    email,
    telephone,
    mot_de_passe,
    role = "patient",
  }) {
    // Vérifier email unique
    const existing = await Utilisateur.unscoped().findOne({ where: { email } });
    if (existing)
      throw Object.assign(new Error("Cet email est déjà utilisé"), {
        statusCode: 409,
        code: "EMAIL_TAKEN",
      });

    const hashed = await hashPassword(mot_de_passe);
    const user = await Utilisateur.create({
      nom,
      prenom,
      date_naissance,
      sexe,
      email,
      telephone,
      mot_de_passe: hashed,
      role,
      statut: "actif",
    });

    // Créer profil médical si patient/usager
    if (role === "patient" || role === "usager") {
      await Patient.create({ id_utilisateur: user.id });
      await DossierMedical.create({
        id_patient: user.id,
        numero_dossier: generateNumeroDossier(),
      });
    }

    // Email de bienvenue
    emailService.sendBienvenue(user).catch(() => {});

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await this._saveRefreshToken(user.id, refreshToken);

    return { user, accessToken, refreshToken };
  },

  /**
   * Inscription professionnel (médecin/technicien)
   */
  async registerPro({
    nom,
    prenom,
    date_naissance,
    sexe,
    email,
    telephone,
    mot_de_passe,
    role,
    numero_ordre,
    specialite,
    id_hopital,
    profil_public = true,
  }) {
    const existing = await Utilisateur.unscoped().findOne({ where: { email } });
    if (existing)
      throw Object.assign(new Error("Cet email est déjà utilisé"), {
        statusCode: 409,
        code: "EMAIL_TAKEN",
      });

    const hashed = await hashPassword(mot_de_passe);
    const user = await Utilisateur.create({
      nom,
      prenom,
      date_naissance,
      sexe,
      email,
      telephone,
      mot_de_passe: hashed,
      role,
      statut: "en_attente",
    });

    await Professionnel.create({
      id_utilisateur: user.id,
      numero_ordre,
      specialite,
      id_hopital,
      profil_public,
      statut_validation: "en_attente",
    });

    // Email de confirmation d'inscription au professionnel
    emailService.sendInscriptionPro(user).catch(() => {});

    // Notification in-app
    notificationService
      .creer({
        id_utilisateur: user.id,
        type: "validation",
        titre: "Inscription soumise",
        contenu:
          "Votre dossier est en cours de validation par l'équipe MediCare BJ.",
      })
      .catch(() => {});

    return { user, message: "Inscription en attente de validation" };
  },

  /**
   * Connexion
   */
  async login({ email, mot_de_passe, ip, user_agent }) {
    const user = await Utilisateur.unscoped().findOne({ where: { email } });
    if (!user)
      throw Object.assign(new Error("Email ou mot de passe incorrect"), {
        statusCode: 401,
        code: "INVALID_CREDENTIALS",
      });

    const valid = await comparePassword(mot_de_passe, user.mot_de_passe);
    if (!valid) {
      await auditService.log({
        id_utilisateur: user.id,
        action: ACTIONS_AUDIT.CONNEXION,
        ip,
        user_agent,
        statut: "echec",
      });
      throw Object.assign(new Error("Email ou mot de passe incorrect"), {
        statusCode: 401,
        code: "INVALID_CREDENTIALS",
      });
    }

    if (user.statut !== "actif") {
      const msg =
        user.statut === "en_attente"
          ? "Compte en attente de validation"
          : "Compte suspendu ou désactivé";
      throw Object.assign(new Error(msg), {
        statusCode: 401,
        code: "ACCOUNT_INACTIVE",
      });
    }

    await user.update({ derniere_connexion: new Date() });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    await this._saveRefreshToken(user.id, refreshToken, ip, user_agent);

    await auditService.log({
      id_utilisateur: user.id,
      action: ACTIONS_AUDIT.CONNEXION,
      ip,
      user_agent,
    });

    // Retourner sans mot de passe
    const userSafe = await Utilisateur.findByPk(user.id);
    return { user: userSafe, accessToken, refreshToken };
  },

  /**
   * Rafraîchir le token
   */
  async refresh(refreshToken) {
    const decoded = verifyRefreshToken(refreshToken);

    const stored = await RefreshToken.findOne({
      where: { token: refreshToken, revoked: false },
    });
    if (!stored)
      throw Object.assign(new Error("Refresh token invalide ou révoqué"), {
        statusCode: 401,
        code: "INVALID_REFRESH_TOKEN",
      });
    if (new Date(stored.expires_at) < new Date())
      throw Object.assign(new Error("Refresh token expiré"), {
        statusCode: 401,
        code: "REFRESH_TOKEN_EXPIRED",
      });

    const user = await Utilisateur.findByPk(decoded.id);
    if (!user || user.statut !== "actif")
      throw Object.assign(new Error("Utilisateur inactif"), {
        statusCode: 401,
      });

    // Rotation : révoquer l'ancien, créer un nouveau
    await stored.update({ revoked: true });
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    await this._saveRefreshToken(user.id, newRefreshToken);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  /**
   * Déconnexion
   */
  async logout(refreshToken, userId, ip, user_agent) {
    if (refreshToken) {
      await RefreshToken.update(
        { revoked: true },
        { where: { token: refreshToken } },
      );
    }
    await auditService.log({
      id_utilisateur: userId,
      action: ACTIONS_AUDIT.DECONNEXION,
      ip,
      user_agent,
    });
  },

  /**
   * Demande de réinitialisation de mot de passe
   */
  async forgotPassword(email) {
    const user = await Utilisateur.unscoped().findOne({ where: { email } });
    // Ne pas révéler si l'email existe
    if (!user) return;

    const { token, hash, expires } = generateResetToken();
    await user.update({
      reset_password_token: hash,
      reset_password_expires: expires,
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await emailService.sendResetPassword(user, resetUrl);
  },

  /**
   * Réinitialisation du mot de passe
   */
  async resetPassword(token, nouveau_mot_de_passe) {
    const hash = hashResetToken(token);
    const user = await Utilisateur.unscoped().findOne({
      where: { reset_password_token: hash },
    });

    if (
      !user ||
      !user.reset_password_expires ||
      new Date(user.reset_password_expires) < new Date()
    ) {
      throw Object.assign(
        new Error("Token de réinitialisation invalide ou expiré"),
        { statusCode: 400, code: "INVALID_RESET_TOKEN" },
      );
    }

    const hashed = await hashPassword(nouveau_mot_de_passe);
    await user.update({
      mot_de_passe: hashed,
      reset_password_token: null,
      reset_password_expires: null,
    });

    // Révoquer tous les refresh tokens
    await RefreshToken.update(
      { revoked: true },
      { where: { id_utilisateur: user.id } },
    );

    await auditService.log({
      id_utilisateur: user.id,
      action: ACTIONS_AUDIT.RESET_PASSWORD,
    });
  },

  /**
   * Sauvegarde un refresh token en base
   */
  async _saveRefreshToken(id_utilisateur, token, ip = null, user_agent = null) {
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({
      id_utilisateur,
      token,
      expires_at,
      ip,
      user_agent,
    });
  },
};

module.exports = { authService };
