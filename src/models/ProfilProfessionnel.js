/**
 * models/ProfilProfessionnel.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProfilProfessionnel = sequelize.define('ProfilProfessionnel', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_utilisateur: { type: DataTypes.UUID, allowNull: false, unique: true },
  id_hopital: { type: DataTypes.UUID, allowNull: true },
  numero_ordre: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  specialite: { type: DataTypes.STRING(150), allowNull: false },
  statut_validation: { type: DataTypes.ENUM('en_attente', 'valide', 'rejete'), allowNull: false, defaultValue: 'en_attente' },
  motif_rejet: { type: DataTypes.TEXT, allowNull: true },
  profil_public: { type: DataTypes.BOOLEAN, defaultValue: true },
  biographie: { type: DataTypes.TEXT, allowNull: true },
  tarif_consultation: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  date_validation: { type: DataTypes.DATE, allowNull: true },
  valide_par: { type: DataTypes.UUID, allowNull: true },
}, {
  tableName: 'profils_professionnels',
  timestamps: true,
});

module.exports = ProfilProfessionnel;
