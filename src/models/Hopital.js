/**
 * models/Hopital.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Hopital = sequelize.define('Hopital', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  nom: { type: DataTypes.STRING(255), allowNull: false },
  type: { type: DataTypes.ENUM('CHU', 'CHD', 'CS', 'clinique', 'cabinet', 'autre'), allowNull: false },
  adresse: { type: DataTypes.TEXT, allowNull: true },
  ville: { type: DataTypes.STRING(100), allowNull: false },
  departement: { type: DataTypes.STRING(100), allowNull: true },
  telephone: { type: DataTypes.STRING(20), allowNull: true },
  email: { type: DataTypes.STRING(255), allowNull: true },
  latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
  longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
  statut: { type: DataTypes.ENUM('actif', 'inactif'), defaultValue: 'actif' },
}, {
  tableName: 'hopitaux',
  timestamps: true,
});

module.exports = Hopital;
