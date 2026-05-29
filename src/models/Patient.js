/**
 * models/Patient.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Patient = sequelize.define('Patient', {
  id_utilisateur: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
  groupe_sanguin: { type: DataTypes.ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'), allowNull: true },
  allergies: { type: DataTypes.TEXT, allowNull: true },
  antecedents: { type: DataTypes.TEXT, allowNull: true },
  poids_kg: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  taille_cm: { type: DataTypes.INTEGER, allowNull: true },
  medecin_traitant: { type: DataTypes.STRING(255), allowNull: true },
  mutuelle: { type: DataTypes.STRING(255), allowNull: true },
  numero_securite_sociale: { type: DataTypes.STRING(50), allowNull: true },
}, {
  tableName: 'patients',
  timestamps: true,
});

module.exports = Patient;
