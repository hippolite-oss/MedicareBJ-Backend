/**
 * models/Consultation.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Consultation = sequelize.define('Consultation', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_dossier: { type: DataTypes.UUID, allowNull: false },
  id_medecin: { type: DataTypes.UUID, allowNull: false },
  id_hopital: { type: DataTypes.UUID, allowNull: true },
  id_rdv: { type: DataTypes.UUID, allowNull: true },
  date_consultation: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  motif: { type: DataTypes.TEXT, allowNull: false },
  diagnostic: { type: DataTypes.TEXT, allowNull: true },
  observations: { type: DataTypes.TEXT, allowNull: true },
  tension_arterielle: { type: DataTypes.STRING(20), allowNull: true },
  temperature: { type: DataTypes.DECIMAL(4, 1), allowNull: true },
  poids_jour: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  type_consultation: { type: DataTypes.ENUM('presentiel', 'teleconsultation'), defaultValue: 'presentiel' },
  statut: { type: DataTypes.ENUM('en_cours', 'terminee', 'annulee'), defaultValue: 'terminee' },
}, {
  tableName: 'consultations',
  timestamps: true,
});

module.exports = Consultation;
