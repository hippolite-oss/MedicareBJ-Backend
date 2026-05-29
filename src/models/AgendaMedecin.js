/**
 * models/AgendaMedecin.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AgendaMedecin = sequelize.define('AgendaMedecin', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_medecin: { type: DataTypes.UUID, allowNull: false },
  id_rdv: { type: DataTypes.UUID, allowNull: true },
  titre: { type: DataTypes.STRING(255), allowNull: false },
  date_debut: { type: DataTypes.DATE, allowNull: false },
  date_fin: { type: DataTypes.DATE, allowNull: false },
  type_entree: { type: DataTypes.ENUM('rdv', 'bloque', 'conge', 'formation', 'autre'), defaultValue: 'rdv' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  visible_patient: { type: DataTypes.BOOLEAN, defaultValue: false },
  couleur: { type: DataTypes.STRING(7), defaultValue: '#1A6B8A' },
}, {
  tableName: 'agenda_medecins',
  timestamps: true,
});

module.exports = AgendaMedecin;
