/**
 * models/DossierMedical.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const DossierMedical = sequelize.define('DossierMedical', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_patient: { type: DataTypes.UUID, allowNull: false, unique: true },
  numero_dossier: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  date_creation: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  date_mise_a_jour: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  statut: { type: DataTypes.ENUM('actif', 'archive', 'supprime'), defaultValue: 'actif' },
  notes_generales: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'dossiers_medicaux',
  timestamps: true,
});

module.exports = DossierMedical;
