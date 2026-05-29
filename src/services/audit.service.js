/**
 * services/audit.service.js — Journal d'audit
 */
const { JournalAudit } = require('../models');
const logger = require('../utils/logger');

const auditService = {
  async log({ id_utilisateur, action, ip, user_agent, details = {}, statut = 'succes' }) {
    try {
      await JournalAudit.create({ id_utilisateur, action, ip, user_agent, details, statut });
    } catch (err) {
      logger.error('Erreur audit log :', err.message);
    }
  },
};

module.exports = { auditService };
