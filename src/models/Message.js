/**
 * models/Message.js
 */
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/database");

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    id_expediteur: { type: DataTypes.UUID, allowNull: false },
    id_destinataire: { type: DataTypes.UUID, allowNull: false },
    contenu: { type: DataTypes.TEXT, allowNull: true },
    type_message: {
      type: DataTypes.ENUM("texte", "image", "fichier", "qr"),
      allowNull: false,
      defaultValue: "texte",
    },
    media_url: { type: DataTypes.TEXT, allowNull: true },
    nom_fichier: { type: DataTypes.STRING(255), allowNull: true },
    mime_type: { type: DataTypes.STRING(100), allowNull: true },
    taille_fichier: { type: DataTypes.INTEGER, allowNull: true },
    lu: { type: DataTypes.BOOLEAN, defaultValue: false },
    date_lecture: { type: DataTypes.DATE, allowNull: true },
    supprime_expediteur: { type: DataTypes.BOOLEAN, defaultValue: false },
    supprime_destinataire: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  {
    tableName: "messages",
    timestamps: true,
  },
);

module.exports = Message;
