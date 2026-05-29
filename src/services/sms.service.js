/**
 * services/sms.service.js — Envoi SMS via Africa's Talking
 */
const logger = require('../utils/logger');

let AT = null;

function getAT() {
  if (!AT) {
    const AfricasTalking = require('africastalking');
    AT = AfricasTalking({
      apiKey: process.env.AT_API_KEY,
      username: process.env.AT_USERNAME,
    });
  }
  return AT;
}

const smsService = {
  async send({ to, message }) {
    try {
      if (process.env.NODE_ENV === 'development') {
        logger.info(`[SMS SIMULÉ] À ${to} : ${message}`);
        return { success: true, simule: true };
      }

      const sms = getAT().SMS;
      const result = await sms.send({
        to: Array.isArray(to) ? to : [to],
        message,
        from: process.env.AT_SENDER_ID || 'MediCareBJ',
      });

      logger.info(`SMS envoyé à ${to}`);
      return result;
    } catch (err) {
      logger.error('Erreur envoi SMS :', err.message);
    }
  },

  async sendRappelRdv(telephone, nomPatient, dateRdv, nomMedecin) {
    const message = `MediCare BJ - Rappel RDV : Bonjour ${nomPatient}, vous avez un rendez-vous avec Dr. ${nomMedecin} le ${dateRdv}. Répondez ANNULER pour annuler.`;
    return this.send({ to: telephone, message });
  },
};

module.exports = { smsService };
