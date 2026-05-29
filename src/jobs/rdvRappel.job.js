/**
 * jobs/rdvRappel.job.js — Envoie des rappels de RDV 24h avant
 */
const { RendezVous, Utilisateur } = require('../models');
const { Op } = require('sequelize');
const { emailService } = require('../services/email.service');
const { smsService } = require('../services/sms.service');
const { notificationService } = require('../services/notification.service');
const logger = require('../utils/logger');

async function rdvRappelJob() {
  try {
    const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const in25h = new Date(Date.now() + 25 * 60 * 60 * 1000);

    const rdvs = await RendezVous.findAll({
      where: {
        statut: { [Op.in]: ['planifie', 'confirme'] },
        date_heure: { [Op.between]: [in24h, in25h] },
        rappel_envoye: false,
      },
      include: [
        { association: 'patient', attributes: ['id', 'nom', 'prenom', 'email', 'telephone'] },
        { association: 'medecin', attributes: ['id', 'nom', 'prenom'] },
      ],
    });

    for (const rdv of rdvs) {
      const dateStr = new Date(rdv.date_heure).toLocaleString('fr-BJ');

      // Email
      emailService.sendRdvRappel(rdv.patient, rdv, rdv.medecin).catch(() => {});

      // SMS
      if (rdv.patient.telephone) {
        smsService.sendRappelRdv(rdv.patient.telephone, rdv.patient.prenom, dateStr, `${rdv.medecin.prenom} ${rdv.medecin.nom}`).catch(() => {});
      }

      // Notification in-app
      notificationService.creer({
        id_utilisateur: rdv.id_patient,
        type: 'rdv',
        titre: 'Rappel rendez-vous demain',
        contenu: `Vous avez un RDV avec Dr. ${rdv.medecin.prenom} ${rdv.medecin.nom} demain à ${dateStr}.`,
      }).catch(() => {});

      await rdv.update({ rappel_envoye: true });
    }

    if (rdvs.length > 0) logger.info(`RDV Rappel Job : ${rdvs.length} rappel(s) envoyé(s)`);
  } catch (err) {
    logger.error('RDV Rappel Job erreur :', err.message);
  }
}

module.exports = { rdvRappelJob };
