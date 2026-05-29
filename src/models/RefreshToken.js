/**
 * models/RefreshToken.js
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RefreshToken = sequelize.define('RefreshToken', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  id_utilisateur: { type: DataTypes.UUID, allowNull: false },
  token: { type: DataTypes.TEXT, allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  revoked: { type: DataTypes.BOOLEAN, defaultValue: false },
  ip: { type: DataTypes.STRING(45), allowNull: true },
  user_agent: { type: DataTypes.TEXT, allowNull: true },
}, {
  tableName: 'refresh_tokens',
  timestamps: true,
  updatedAt: false,
});

module.exports = RefreshToken;
