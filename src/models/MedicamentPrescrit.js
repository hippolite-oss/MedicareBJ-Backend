/**
 * models/MedicamentPrescrit.js
 * Table d'association entre Prescription et Medicament
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MedicamentPrescrit = sequelize.define('MedicamentPrescrit', {
  id_prescription: { 
    type: DataTypes.UUID, 
    allowNull: false,
    primaryKey: true,
  },
  id_medicament: { 
    type: DataTypes.UUID, 
    allowNull: false,
    primaryKey: true,
  },
  frequence: { type: DataTypes.STRING(200), allowNull: false }, // ex: 3 fois/jour
  duree_jours: { type: DataTypes.INTEGER, allowNull: true },
  instructions: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'medicaments_prescrits',
  timestamps: true,
});

module.exports = MedicamentPrescrit;
