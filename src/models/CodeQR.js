/**
 * models/CodeQR.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CodeQR = sequelize.define('CodeQR', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_dossier: { type: DataTypes.UUID, allowNull: false },
  id_patient: { type: DataTypes.UUID, allowNull: false },
  token: { type: DataTypes.TEXT, allowNull: false },
  type_acces: { type: DataTypes.ENUM('lecture', 'ecriture'), allowNull: false, defaultValue: 'lecture' },
  statut: { type: DataTypes.ENUM('actif', 'expire', 'revoque'), defaultValue: 'actif' },
  date_expiration: { type: DataTypes.DATE, allowNull: false },
  // Champs conservés pour historique mais non utilisés pour bloquer l'usage
  utilise_par: { type: DataTypes.UUID, allowNull: true, comment: 'Historique: premier utilisateur (obsolète)' },
  date_utilisation: { type: DataTypes.DATE, allowNull: true, comment: 'Historique: première utilisation (obsolète)' },
}, {
  tableName: 'codes_qr',
  timestamps: true,
});

module.exports = CodeQR;
