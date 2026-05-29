/**
 * models/RendezVous.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RendezVous = sequelize.define('RendezVous', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_patient: { type: DataTypes.UUID, allowNull: false },
  id_medecin: { type: DataTypes.UUID, allowNull: false },
  id_hopital: { type: DataTypes.UUID, allowNull: true },
  date_heure: { type: DataTypes.DATE, allowNull: false },
  duree_minutes: { type: DataTypes.INTEGER, defaultValue: 30 },
  motif: { type: DataTypes.TEXT, allowNull: true },
  statut: { type: DataTypes.ENUM('planifie', 'confirme', 'annule', 'termine'), defaultValue: 'planifie' },
  notes_medecin: { type: DataTypes.TEXT, allowNull: true },
  rappel_envoye: { type: DataTypes.BOOLEAN, defaultValue: false },
  annule_par: { type: DataTypes.ENUM('patient', 'medecin', 'admin'), allowNull: true },
  motif_annulation: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'rendez_vous',
  timestamps: true,
});

module.exports = RendezVous;
