/**
 * services/paiement.service.js — Intégration MTN Mobile Money + CinetPay
 */
const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger');

const paiementService = {
  /**
   * Initier un paiement MTN Mobile Money
   */
  async initierMTN({ telephone, montant, id_paiement }) {
    try {
      // Obtenir un access token MTN
      const tokenRes = await axios.post(
        'https://sandbox.momodeveloper.mtn.com/collection/token/',
        {},
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${process.env.MTN_API_USER}:${process.env.MTN_API_KEY}`).toString('base64')}`,
            'Ocp-Apim-Subscription-Key': process.env.MTN_SUBSCRIPTION_KEY,
          },
        }
      );

      const accessToken = tokenRes.data.access_token;

      // Demande de paiement
      const reference = id_paiement;
      await axios.post(
        'https://sandbox.momodeveloper.mtn.com/collection/v1_0/requesttopay',
        {
          amount: String(montant),
          currency: process.env.MTN_CURRENCY || 'XOF',
          externalId: reference,
          payer: { partyIdType: 'MSISDN', partyId: telephone },
          payerMessage: 'Paiement MediCare BJ',
          payeeNote: 'Consultation médicale',
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Reference-Id': reference,
            'X-Target-Environment': process.env.MTN_ENVIRONMENT || 'sandbox',
            'Ocp-Apim-Subscription-Key': process.env.MTN_SUBSCRIPTION_KEY,
            'Content-Type': 'application/json',
          },
        }
      );

      return { reference_mtn: reference, statut: 'en_attente' };
    } catch (err) {
      logger.error('Erreur MTN MoMo :', err.response?.data || err.message);
      // En mode sandbox/dev, simuler le succès
      if (process.env.NODE_ENV === 'development') {
        return { reference_mtn: id_paiement, statut: 'en_attente', simule: true };
      }
      throw new Error('Erreur initiation paiement MTN');
    }
  },

  /**
   * Initier un paiement CinetPay
   */
  async initierCinetPay({ montant, id_paiement, email, description = 'Paiement MediCare BJ' }) {
    try {
      const res = await axios.post('https://api-checkout.cinetpay.com/v2/payment', {
        apikey: process.env.CINETPAY_APIKEY,
        site_id: process.env.CINETPAY_SITE_ID,
        transaction_id: id_paiement,
        amount: montant,
        currency: 'XOF',
        description,
        return_url: `${process.env.FRONTEND_URL}/paiement/retour`,
        notify_url: process.env.CINETPAY_NOTIFY_URL,
        customer_email: email,
        channels: 'ALL',
        lang: 'fr',
      });

      return { payment_url: res.data.data?.payment_url, statut: 'en_attente' };
    } catch (err) {
      logger.error('Erreur CinetPay :', err.response?.data || err.message);
      throw new Error('Erreur initiation paiement CinetPay');
    }
  },

  /**
   * Vérifier la signature HMAC d'un webhook CinetPay
   */
  verifierSignatureCinetPay(payload, signature) {
    const secret = process.env.CINETPAY_SECRET_KEY;
    const computed = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    return computed === signature;
  },

  /**
   * Vérifier la signature d'un webhook MTN
   */
  verifierSignatureMTN(payload, signature) {
    const secret = process.env.MTN_API_KEY;
    const computed = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    return computed === signature;
  },
};

module.exports = { paiementService };
