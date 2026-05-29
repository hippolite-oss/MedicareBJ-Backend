/**
 * models/Analyse.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Analyse = sequelize.define('Analyse', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_consultation: { type: DataTypes.UUID, allowNull: true },
  id_dossier: { type: DataTypes.UUID, allowNull: false },
  id_medecin_demandeur: { type: DataTypes.UUID, allowNull: false },
  id_technicien: { type: DataTypes.UUID, allowNull: true },
  type_analyse: { type: DataTypes.STRING(255), allowNull: false },
  resultat: { type: DataTypes.TEXT, allowNull: true },
  interpretation: { type: DataTypes.TEXT, allowNull: true },
  fichier_joint: { type: DataTypes.STRING(500), allowNull: true },
  statut: { type: DataTypes.ENUM('demandee', 'en_cours', 'disponible', 'annulee'), defaultValue: 'demandee' },
  date_demande: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  date_resultat: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'analyses',
  timestamps: true,
});

module.exports = Analyse;
