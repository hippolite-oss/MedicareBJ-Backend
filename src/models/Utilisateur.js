/**
 * models/Utilisateur.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Utilisateur = sequelize.define('Utilisateur', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nom: { type: DataTypes.STRING(100), allowNull: false },
  prenom: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
  mot_de_passe: { type: DataTypes.STRING(255), allowNull: false },
  telephone: { type: DataTypes.STRING(20), allowNull: true },
  date_naissance: { type: DataTypes.DATEONLY, allowNull: true },
  sexe: { type: DataTypes.ENUM('M', 'F', 'autre'), allowNull: true },
  role: { type: DataTypes.ENUM('patient', 'usager', 'medecin', 'technicien', 'admin'), allowNull: false, defaultValue: 'patient' },
  statut: { type: DataTypes.ENUM('actif', 'en_attente', 'suspendu', 'supprime'), allowNull: false, defaultValue: 'actif' },
  photo_profil: { type: DataTypes.STRING(500), allowNull: true },
  derniere_connexion: { type: DataTypes.DATE, allowNull: true },
  reset_password_token: { type: DataTypes.STRING(255), allowNull: true },
  reset_password_expires: { type: DataTypes.DATE, allowNull: true },
  fcm_token: { type: DataTypes.STRING(500), allowNull: true }, // Firebase push mobile
}, {
  tableName: 'utilisateurs',
  timestamps: true,
  defaultScope: {
    attributes: { exclude: ['mot_de_passe', 'reset_password_token', 'reset_password_expires'] },
  },
  scopes: {
    withPassword: { attributes: {} },
  },
});

module.exports = Utilisateur;
