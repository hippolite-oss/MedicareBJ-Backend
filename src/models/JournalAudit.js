/**
 * models/JournalAudit.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const JournalAudit = sequelize.define('JournalAudit', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_utilisateur: { type: DataTypes.UUID, allowNull: true },
  action: { type: DataTypes.STRING(100), allowNull: false },
  ip: { type: DataTypes.STRING(45), allowNull: true },
  user_agent: { type: DataTypes.TEXT, allowNull: true },
  details: { type: DataTypes.JSON, allowNull: true },
  statut: { type: DataTypes.ENUM('succes', 'echec'), defaultValue: 'succes' },
}, {
  tableName: 'journal_audit',
  timestamps: true,
  updatedAt: false,
});

module.exports = JournalAudit;
