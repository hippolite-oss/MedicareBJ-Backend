/**
 * models/ProfilMedical.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProfilMedical = sequelize.define('ProfilMedical', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_utilisateur: { type: DataTypes.UUID, allowNull: false, unique: true },
  groupe_sanguin: { type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'), allowNull: true },
  allergies: { type: DataTypes.TEXT, allowNull: true },
  antecedents: { type: DataTypes.TEXT, allowNull: true },
  poids_kg: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  taille_cm: { type: DataTypes.INTEGER, allowNull: true },
  medecin_traitant: { type: DataTypes.STRING(255), allowNull: true },
  mutuelle: { type: DataTypes.STRING(255), allowNull: true },
  numero_securite_sociale: { type: DataTypes.STRING(50), allowNull: true },
}, {
  tableName: 'profils_medicaux',
  timestamps: true,
});

module.exports = ProfilMedical;
