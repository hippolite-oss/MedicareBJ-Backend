/**
 * models/Prescription.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Prescription = sequelize.define('Prescription', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_consultation: { type: DataTypes.UUID, allowNull: false, unique: true },
  id_medecin: { type: DataTypes.UUID, allowNull: false },
  id_dossier: { type: DataTypes.UUID, allowNull: false },
  numero_ordonnance: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  date_prescription: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  instructions_generales: { type: DataTypes.TEXT, allowNull: true },
  statut: { type: DataTypes.ENUM('active', 'terminee', 'annulee'), defaultValue: 'active' },
  pdf_url: { type: DataTypes.STRING(500), allowNull: true },
}, {
  tableName: 'prescriptions',
  timestamps: true,
});

module.exports = Prescription;
