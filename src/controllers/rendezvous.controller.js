/**
 * controllers/rendezvous.controller.js
 */
const { RendezVous, Utilisateur, Professionnel, AgendaMedecin, Hopital, Paiement } = require('../models');
const { success, created, notFound, conflict, forbidden, badRequest } = require('../utils/apiResponse');
const { getPagination, buildMeta } = require('../utils/pagination');
const { notificationService } = require('../services/notification.service');
const { emailService } = require('../services/email.service');
const { verifierCreneauDisponible } = require('../services/rendezvous.service');
const { TARIF_CONSULTATION_RDV } = require('../utils/constants');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

const rendezvousController = {
  async medecinsDisponibles(req, res, next) {
    try {
      const { date, specialite, id_hopital } = req.query;
      const { Consultation, DossierMedical } = require('../models');
      
      console.log('medecinsDisponibles - User role:', req.user.role); // Debug
      
      // Si l'utilisateur n'est pas un patient, retourner tous les médecins publics
      if (req.user.role !== 'patient') {
        const where = { statut_validation: 'valide', profil_public: true };
        if (specialite) where.specialite = { [Op.like]: `%${specialite}%` };
        if (id_hopital) where.id_hopital = id_hopital;

        const profils = await Professionnel.findAll({
          where,
          include: [
            { association: 'utilisateur', attributes: ['id', 'nom', 'prenom', 'photo_profil'] },
            { association: 'hopital', attributes: ['id', 'nom', 'ville', 'telephone'] },
          ],
        });
        
        console.log('Médecins publics trouvés (non-patient):', profils.length); // Debug
        return success(res, { medecins: profils });
      }

      // Pour les patients : récupérer le dossier médical
      const dossier = await DossierMedical.findOne({ where: { id_patient: req.user.id } });
      console.log('Dossier médical trouvé:', dossier ? dossier.id : 'null'); // Debug
      
      if (!dossier) {
        // Même sans dossier, retourner les médecins publics
        const where = { statut_validation: 'valide', profil_public: true };
        if (specialite) where.specialite = { [Op.like]: `%${specialite}%` };
        if (id_hopital) where.id_hopital = id_hopital;

        const profils = await Professionnel.findAll({
          where,
          include: [
            { association: 'utilisateur', attributes: ['id', 'nom', 'prenom', 'photo_profil'] },
            { association: 'hopital', attributes: ['id', 'nom', 'ville', 'telephone'] },
          ],
        });
        
        console.log('Médecins publics trouvés (patient sans dossier):', profils.length); // Debug
        return success(res, { medecins: profils });
      }

      // Récupérer les médecins qui ont déjà consulté ce patient
      const consultations = await Consultation.findAll({
        where: { id_dossier: dossier.id },
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('id_medecin')), 'id_medecin']],
        raw: true,
      });
      const medecinsDejaTrait = consultations.map(c => c.id_medecin);
      console.log('Médecins ayant déjà traité ce patient:', medecinsDejaTrait.length); // Debug

      // Construire la requête pour les médecins
      const where = { statut_validation: 'valide' };
      if (specialite) where.specialite = { [Op.like]: `%${specialite}%` };
      if (id_hopital) where.id_hopital = id_hopital;

      // Récupérer tous les médecins validés
      const allProfils = await Professionnel.findAll({
        where,
        include: [
          { association: 'utilisateur', attributes: ['id', 'nom', 'prenom', 'photo_profil'] },
          { association: 'hopital', attributes: ['id', 'nom', 'ville', 'telephone'] },
        ],
      });
      
      console.log('Tous les médecins validés:', allProfils.length); // Debug

      // Filtrer selon la visibilité
      const medecinsVisibles = allProfils.filter(profil => {
        const profilPublic = profil.profil_public;
        const dejaTrait = medecinsDejaTrait.includes(profil.id_utilisateur);
        
        console.log(`Médecin ${profil.id_utilisateur}: public=${profilPublic}, déjà traité=${dejaTrait}`); // Debug
        
        // Visible si profil public OU déjà traité ce patient
        return profilPublic || dejaTrait;
      });

      console.log('Médecins visibles après filtrage:', medecinsVisibles.length); // Debug
      return success(res, { medecins: medecinsVisibles });
    } catch (err) { 
      console.error('Erreur medecinsDisponibles:', err); // Debug
      next(err); 
    }
  },

  async disponibilites(req, res, next) {
    try {
      const { id_medecin } = req.params;
      const { date_debut, date_fin } = req.query;

      const rdvExistants = await RendezVous.findAll({
        where: {
          id_medecin,
          statut: { [Op.in]: ['planifie', 'confirme'] },
          date_heure: { [Op.between]: [new Date(date_debut), new Date(date_fin)] },
        },
        attributes: ['date_heure', 'duree_minutes'],
      });

      const bloques = await AgendaMedecin.findAll({
        where: {
          id_medecin,
          type_entree: { [Op.ne]: 'rdv' },
          date_debut: { [Op.lte]: new Date(date_fin) },
          date_fin: { [Op.gte]: new Date(date_debut) },
        },
      });

      return success(res, { rdv_existants: rdvExistants, bloques });
    } catch (err) { next(err); }
  },

  async demandePaiement(req, res, next) {
    try {
      const { id_medecin, date_heure, motif, duree_minutes = 30 } = req.body;

      const profil = await Professionnel.findOne({
        where: { id_utilisateur: id_medecin, statut_validation: 'valide' },
        include: [{ association: 'hopital' }],
      });
      if (!profil) return notFound(res, 'Médecin introuvable');
      if (!profil.hopital) return badRequest(res, 'Ce médecin n\'est rattaché à aucun établissement');
      if (!profil.hopital.telephone) {
        return badRequest(res, 'L\'établissement n\'a pas de numéro Mobile Money configuré');
      }

      const disponible = await verifierCreneauDisponible(id_medecin, date_heure, duree_minutes);
      if (!disponible) return conflict(res, 'Ce créneau est déjà réservé');

      const paiement = await Paiement.create({
        id_patient: req.user.id,
        montant: TARIF_CONSULTATION_RDV,
        mode_paiement: 'mtn_money',
        statut: 'en_attente',
        metadata: {
          type: 'consultation_rdv',
          pending_rdv: {
            id_medecin,
            id_hopital: profil.hopital.id,
            date_heure,
            motif,
            duree_minutes,
          },
          hopital: {
            id: profil.hopital.id,
            nom: profil.hopital.nom,
            telephone: profil.hopital.telephone,
          },
        },
      });

      return created(res, {
        id_paiement: paiement.id,
        montant: Number(paiement.montant),
        hopital: {
          id: profil.hopital.id,
          nom: profil.hopital.nom,
          telephone: profil.hopital.telephone,
        },
      }, 'Demande de paiement créée — finalisez le règlement pour confirmer le RDV');
    } catch (err) { next(err); }
  },

  async create(req, res, next) {
    try {
      if (req.user.role === 'patient' || req.user.role === 'usager') {
        return badRequest(res, 'Le paiement de la consultation (5 000 FCFA) est requis avant la réservation');
      }

      const { id_medecin, id_hopital, date_heure, motif, duree_minutes = 30 } = req.body;

      const disponible = await verifierCreneauDisponible(id_medecin, date_heure, duree_minutes);
      if (!disponible) return conflict(res, 'Ce créneau est déjà réservé');

      const rdv = await RendezVous.create({ id_patient: req.user.id, id_medecin, id_hopital, date_heure, motif, duree_minutes });

      // Créer entrée agenda
      await AgendaMedecin.create({
        id_medecin,
        id_rdv: rdv.id,
        titre: `RDV - ${req.user.prenom} ${req.user.nom}`,
        date_debut: date_heure,
        date_fin: new Date(new Date(date_heure).getTime() + duree_minutes * 60000),
        type_entree: 'rdv',
      });

      // Notifier médecin et patient
      const medecin = await Utilisateur.findByPk(id_medecin);
      
      // Notification pour le médecin avec lien direct vers le RDV
      notificationService.creer({ 
        id_utilisateur: id_medecin, 
        type: 'rdv', 
        titre: 'Nouveau rendez-vous', 
        contenu: `${req.user.prenom} ${req.user.nom} a demandé un RDV le ${new Date(date_heure).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}. Motif : ${motif || 'Non spécifié'}`,
        lien: `/medecin/agenda?date=${new Date(date_heure).toISOString().split('T')[0]}`,
        metadata: { id_rdv: rdv.id, date_heure, statut: 'planifie' }
      }).catch(() => {});
      
      // Notification pour le patient
      notificationService.creer({ 
        id_utilisateur: req.user.id, 
        type: 'rdv', 
        titre: 'Rendez-vous envoyé, en attente de validation', 
        contenu: `Votre demande de RDV avec Dr. ${medecin?.prenom} ${medecin?.nom} le ${new Date(date_heure).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} a été envoyée. Le médecin doit confirmer votre rendez-vous.`,
        metadata: { id_rdv: rdv.id, date_heure, statut: 'planifie' }
      }).catch(() => {});
      
      emailService.sendRdvConfirmation(req.user, rdv, medecin || {}).catch(() => {});

      return created(res, { rdv }, 'Rendez-vous créé');
    } catch (err) { next(err); }
  },

  async mesRdv(req, res, next) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      const where = { id_patient: req.user.id };
      if (req.query.statut) where.statut = req.query.statut;

      const { count, rows } = await RendezVous.findAndCountAll({
        where, limit, offset, order: [['date_heure', 'DESC']],
        include: [
          { association: 'medecin', attributes: ['id', 'nom', 'prenom', 'photo_profil'] },
          { association: 'hopital', attributes: ['id', 'nom', 'ville'] },
        ],
      });
      return success(res, { rdv: rows, meta: buildMeta(count, page, limit) });
    } catch (err) { next(err); }
  },

  async agendaDuJour(req, res, next) {
    try {
      // Accepte une date optionnelle en query param, sinon aujourd'hui
      const targetDate = req.query.date ? new Date(req.query.date) : new Date();
      const start = new Date(targetDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(targetDate);
      end.setHours(23, 59, 59, 999);

      const rdv = await RendezVous.findAll({
        where: {
          id_medecin: req.user.id,
          date_heure: { [Op.between]: [start, end] },
          statut: { [Op.ne]: 'annule' },
        },
        order: [['date_heure', 'ASC']],
        include: [{ association: 'patient', attributes: ['id', 'nom', 'prenom', 'telephone'] }],
      });
      return success(res, { rdv });
    } catch (err) { next(err); }
  },

  async rdvEnAttente(req, res, next) {
    try {
      const { page, limit, offset } = getPagination(req.query);
      
      // Récupérer tous les RDV planifiés (en attente de confirmation) du médecin
      const { count, rows } = await RendezVous.findAndCountAll({
        where: {
          id_medecin: req.user.id,
          statut: 'planifie',
          date_heure: { [Op.gte]: new Date() }, // Seulement les RDV futurs
        },
        limit,
        offset,
        order: [['date_heure', 'ASC']],
        include: [
          { association: 'patient', attributes: ['id', 'nom', 'prenom', 'telephone', 'email'] },
          { association: 'hopital', attributes: ['id', 'nom', 'ville'] },
        ],
      });
      
      return success(res, { rdv: rows, meta: buildMeta(count, page, limit) });
    } catch (err) { next(err); }
  },

  async updateStatut(req, res, next) {
    try {
      const rdv = await RendezVous.findByPk(req.params.id, {
        include: [
          { association: 'patient', attributes: ['id', 'nom', 'prenom', 'email'] },
          { association: 'medecin', attributes: ['id', 'nom', 'prenom', 'email'] }
        ]
      });
      if (!rdv) return notFound(res, 'Rendez-vous introuvable');

      const { statut, motif_annulation } = req.body;
      const isPatient = req.user.id === rdv.id_patient;
      const isMedecin = req.user.id === rdv.id_medecin;

      if (statut === 'annule' && !isPatient && !isMedecin) return forbidden(res);
      if (statut === 'confirme' && !isMedecin) return forbidden(res, 'Seul le médecin peut confirmer');

      await rdv.update({ statut, motif_annulation, annule_par: statut === 'annule' ? (isPatient ? 'patient' : 'medecin') : null });

      // Mettre à jour agenda
      await AgendaMedecin.update({ type_entree: statut === 'annule' ? 'autre' : 'rdv' }, { where: { id_rdv: rdv.id } });

      // Notifier l'autre partie
      const notifTarget = isPatient ? rdv.id_medecin : rdv.id_patient;
      const notifTargetUser = isPatient ? rdv.medecin : rdv.patient;
      
      let titre = '';
      let contenu = '';
      
      if (statut === 'confirme') {
        titre = 'Rendez-vous confirmé';
        contenu = `Votre rendez-vous avec Dr. ${rdv.medecin.prenom} ${rdv.medecin.nom} le ${new Date(rdv.date_heure).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} a été confirmé.`;
      } else if (statut === 'annule') {
        titre = 'Rendez-vous annulé';
        if (isPatient) {
          contenu = `${rdv.patient.prenom} ${rdv.patient.nom} a annulé son rendez-vous du ${new Date(rdv.date_heure).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}.`;
        } else {
          contenu = `Votre rendez-vous avec Dr. ${rdv.medecin.prenom} ${rdv.medecin.nom} du ${new Date(rdv.date_heure).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} a été annulé.`;
          if (motif_annulation) {
            contenu += ` Motif : ${motif_annulation}`;
          }
        }
      }
      
      // Créer la notification
      await notificationService.creer({ 
        id_utilisateur: notifTarget, 
        type: 'rdv', 
        titre, 
        contenu,
        metadata: { id_rdv: rdv.id, statut }
      });

      return success(res, { rdv }, 'Statut mis à jour');
    } catch (err) { next(err); }
  },
};

module.exports = { rendezvousController };
