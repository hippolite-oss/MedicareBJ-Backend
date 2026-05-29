/**
 * models/Medicament.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Medicament = sequelize.define('Medicament', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nom: { type: DataTypes.STRING(255), allowNull: false },
  dosage: { type: DataTypes.STRING(100), allowNull: false },
  forme: { type: DataTypes.STRING(100), allowNull: true }, // comprimé, sirop, injection...
}, {
  tableName: 'medicaments',
  timestamps: true,
});

module.exports = Medicament;
