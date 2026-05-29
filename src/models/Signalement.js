/**
 * models/Signalement.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Signalement = sequelize.define('Signalement', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_emetteur: { type: DataTypes.UUID, allowNull: false },
  id_cible: { type: DataTypes.UUID, allowNull: false },
  motif: { type: DataTypes.TEXT, allowNull: false },
  statut: { type: DataTypes.ENUM('en_attente', 'en_cours', 'traite', 'rejete'), defaultValue: 'en_attente' },
  decision: {
    type: DataTypes.ENUM('avertissement', 'suspension_30j', 'suspension_definitive', 'rejete'),
    allowNull: true,
  },
  decision_admin: { type: DataTypes.TEXT, allowNull: true },
  traite_par: { type: DataTypes.UUID, allowNull: true },
  date_traitement: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'signalements',
  timestamps: true,
});

module.exports = Signalement;
