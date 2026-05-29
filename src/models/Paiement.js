/**
 * models/Paiement.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Paiement = sequelize.define('Paiement', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_patient: { type: DataTypes.UUID, allowNull: false },
  id_consultation: { type: DataTypes.UUID, allowNull: true },
  id_rdv: { type: DataTypes.UUID, allowNull: true },
  montant: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  devise: { type: DataTypes.STRING(5), defaultValue: 'XOF' },
  mode_paiement: { type: DataTypes.ENUM('mtn_money', 'moov_money', 'cinetpay', 'especes'), allowNull: false },
  statut: { type: DataTypes.ENUM('en_attente', 'complete', 'echoue', 'rembourse'), defaultValue: 'en_attente' },
  reference_externe: { type: DataTypes.STRING(255), allowNull: true }, // référence MTN/CinetPay
  telephone_paiement: { type: DataTypes.STRING(20), allowNull: true },
  numero_recu: { type: DataTypes.STRING(50), allowNull: true, unique: true },
  pdf_recu_url: { type: DataTypes.STRING(500), allowNull: true },
  date_paiement: { type: DataTypes.DATE, allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true },
}, {
  tableName: 'paiements',
  timestamps: true,
});

module.exports = Paiement;
