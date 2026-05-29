/**
 * models/AccesDossier.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AccesDossier = sequelize.define('AccesDossier', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_dossier: { type: DataTypes.UUID, allowNull: false },
  id_professionnel: { type: DataTypes.UUID, allowNull: false },
  type_acces: { type: DataTypes.ENUM('lecture', 'ecriture'), allowNull: false, defaultValue: 'lecture' },
  statut: { type: DataTypes.ENUM('actif', 'revoque', 'expire'), defaultValue: 'actif' },
  date_debut: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  date_fin: { type: DataTypes.DATE, allowNull: true },
  source: { type: DataTypes.ENUM('qr', 'manuel', 'admin'), defaultValue: 'manuel' },
  id_code_qr: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'acces_dossiers',
  timestamps: true,
});

module.exports = AccesDossier;
