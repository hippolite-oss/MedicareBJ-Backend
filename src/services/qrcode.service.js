/**
 * services/qrcode.service.js — Génération et validation des codes QR
 */
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const { CodeQR, AccesDossier } = require('../models');
const { addHours } = require('../utils/formatDate');

const qrcodeService = {
  /**
   * Génère un code QR sécurisé pour un dossier
   */
  async genererQR({ id_patient, id_dossier, duree_heures, type_acces }) {
    const jti = uuidv4();
    
    // Calculer la date d'expiration
    const date_expiration = addHours(new Date(), duree_heures);

    const payload = {
      id_dossier,
      id_patient,
      type_acces,
      jti,
    };

    // Créer le token JWT avec expiration
    const token = jwt.sign(payload, process.env.QR_SECRET, { expiresIn: `${duree_heures}h` });

    // Générer l'image QR en base64
    const qrImage = await QRCode.toDataURL(token, {
      width: 300,
      margin: 2,
      color: { dark: '#1A6B8A', light: '#FFFFFF' },
    });

    // Sauvegarder en base
    const codeQR = await CodeQR.create({
      id_dossier,
      id_patient,
      token,
      type_acces,
      date_expiration,
      statut: 'actif',
    });

    return { codeQR, qrImage, token, date_expiration };
  },

  async validerQR(token) {
    // Vérifier signature JWT
    const decoded = jwt.verify(token, process.env.QR_SECRET);

    // Vérifier en base - Accepter les QR actifs (pas "utilisé" car usage multiple autorisé)
    const codeQR = await CodeQR.findOne({ where: { token, statut: 'actif' } });
    if (!codeQR) {
      // Vérifier si le QR existe mais est révoqué ou expiré
      const codeQRInactif = await CodeQR.findOne({ where: { token } });
      if (codeQRInactif) {
        if (codeQRInactif.statut === 'revoque') {
          throw new Error('Code QR révoqué par le patient');
        }
        if (codeQRInactif.statut === 'expire') {
          throw new Error('Code QR expiré');
        }
      }
      throw new Error('Code QR invalide');
    }

    // Vérifier expiration
    if (new Date(codeQR.date_expiration) < new Date()) {
      await codeQR.update({ statut: 'expire' });
      throw new Error('Code QR expiré');
    }

    return { codeQR, decoded };
  },

  /**
   * Crée un AccesDossier pour le professionnel (usage multiple autorisé)
   */
  async utiliserQR(codeQR, id_professionnel) {
    // Ne plus marquer le QR comme "utilisé" pour permettre l'usage multiple
    // Le QR reste actif jusqu'à expiration ou révocation manuelle
    
    // Vérifier si le professionnel a déjà un accès actif via ce QR
    const accesExistant = await AccesDossier.findOne({
      where: {
        id_dossier: codeQR.id_dossier,
        id_professionnel,
        id_code_qr: codeQR.id,
        statut: 'actif',
      },
    });

    // Si un accès actif existe déjà, le prolonger au lieu d'en créer un nouveau
    if (accesExistant) {
      await accesExistant.update({
        date_fin: addHours(new Date(), 24), // Prolonger de 24h
      });
      return accesExistant;
    }

    // Créer un nouvel AccesDossier temporaire (24h)
    const acces = await AccesDossier.create({
      id_dossier: codeQR.id_dossier,
      id_professionnel,
      type_acces: codeQR.type_acces,
      statut: 'actif',
      date_debut: new Date(),
      date_fin: addHours(new Date(), 24),
      source: 'qr',
      id_code_qr: codeQR.id,
    });

    return acces;
  },
};

module.exports = { qrcodeService };
