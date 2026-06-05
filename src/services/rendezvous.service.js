/**
 * services/rendezvous.service.js — Logique métier RDV (disponibilité, création après paiement)
 */
const { RendezVous, AgendaMedecin, Utilisateur } = require('../models');
const { notificationService } = require('./notification.service');
const { emailService } = require('./email.service');
const { Op } = require('sequelize');

async function verifierCreneauDisponible(id_medecin, date_heure, duree_minutes = 30) {
  const conflit = await RendezVous.findOne({
    where: {
      id_medecin,
      statut: { [Op.in]: ['planifie', 'confirme'] },
      date_heure: {
        [Op.between]: [
          new Date(new Date(date_heure).getTime() - duree_minutes * 60000),
          new Date(new Date(date_heure).getTime() + duree_minutes * 60000),
        ],
      },
    },
  });
  return !conflit;
}

async function creerRdvApresPaiement(paiement, patient) {
  const meta = paiement.metadata?.pending_rdv;
  if (!meta || paiement.id_rdv) return null;

  const { id_medecin, id_hopital, date_heure, motif, duree_minutes = 30 } = meta;
  const disponible = await verifierCreneauDisponible(id_medecin, date_heure, duree_minutes);
  if (!disponible) {
    await paiement.update({
      metadata: { ...paiement.metadata, rdv_erreur: 'creneau_indisponible' },
    });
    notificationService.creer({
      id_utilisateur: paiement.id_patient,
      type: 'rdv',
      titre: 'Rendez-vous non créé',
      contenu: 'Votre paiement a été reçu mais le créneau n\'est plus disponible. Contactez le support pour un remboursement.',
    }).catch(() => {});
    return null;
  }

  const rdv = await RendezVous.create({
    id_patient: paiement.id_patient,
    id_medecin,
    id_hopital,
    date_heure,
    motif,
    duree_minutes,
    statut: 'planifie',
  });

  await paiement.update({ id_rdv: rdv.id });

  await AgendaMedecin.create({
    id_medecin,
    id_rdv: rdv.id,
    titre: `RDV - ${patient.prenom} ${patient.nom}`,
    date_debut: date_heure,
    date_fin: new Date(new Date(date_heure).getTime() + duree_minutes * 60000),
    type_entree: 'rdv',
  });

  const medecin = await Utilisateur.findByPk(id_medecin);

  notificationService.creer({
    id_utilisateur: id_medecin,
    type: 'rdv',
    titre: 'Nouveau rendez-vous',
    contenu: `${patient.prenom} ${patient.nom} a réservé un RDV le ${new Date(date_heure).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}. Motif : ${motif || 'Non spécifié'}`,
    lien: `/medecin/agenda?date=${new Date(date_heure).toISOString().split('T')[0]}`,
    metadata: { id_rdv: rdv.id, date_heure, statut: 'planifie' },
  }).catch(() => {});

  notificationService.creer({
    id_utilisateur: paiement.id_patient,
    type: 'rdv',
    titre: 'Rendez-vous enregistré',
    contenu: `Votre RDV avec Dr. ${medecin?.prenom} ${medecin?.nom} le ${new Date(date_heure).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} est en attente de confirmation par le médecin.`,
    metadata: { id_rdv: rdv.id, date_heure, statut: 'planifie' },
  }).catch(() => {});

  emailService.sendRdvConfirmation(patient, rdv, medecin || {}).catch(() => {});

  return rdv;
}

module.exports = { verifierCreneauDisponible, creerRdvApresPaiement };
