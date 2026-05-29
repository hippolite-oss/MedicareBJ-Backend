/**
 * models/Notification.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_utilisateur: { type: DataTypes.UUID, allowNull: false },
  type: {
    type: DataTypes.ENUM(
      'consultation', 'prescription', 'analyse', 'rdv',
      'paiement', 'message', 'acces', 'validation', 'signalement', 'systeme'
    ),
    allowNull: false,
  },
  titre: { type: DataTypes.STRING(255), allowNull: false },
  contenu: { type: DataTypes.TEXT, allowNull: false },
  lu: { type: DataTypes.BOOLEAN, defaultValue: false },
  date_lecture: { type: DataTypes.DATE, allowNull: true },
  lien: { type: DataTypes.STRING(500), allowNull: true }, // deep link
  metadata: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: 'notifications',
  timestamps: true,
});

module.exports = Notification;
