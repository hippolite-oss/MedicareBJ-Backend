/**
 * controllers/prescription.controller.js
 */
const {
  Prescription,
  Medicament,
  MedicamentPrescrit,
  Consultation,
  DossierMedical,
  Utilisateur,
} = require("../models");
const {
  success,
  created,
  notFound,
  conflict,
  forbidden,
} = require("../utils/apiResponse");
const { pdfService } = require("../services/pdf.service");
const { medicamentService } = require("../services/medicament.service");
const { notificationService } = require("../services/notification.service");
const { auditService } = require("../services/audit.service");
const { generateNumeroOrdonnance } = require("../utils/generateNumero");
const { ACTIONS_AUDIT } = require("../utils/constants");

const prescriptionController = {
  async create(req, res, next) {
    try {
      const { id_consultation, instructions_generales, medicaments } = req.body;

      const consultation = await Consultation.findByPk(id_consultation, {
        include: [{ association: "prescription" }],
      });
      if (!consultation) return notFound(res, "Consultation introuvable");
      if (consultation.id_medecin !== req.user.id)
        return forbidden(res, "Seul le médecin auteur peut prescrire");
      if (consultation.prescription)
        return conflict(
          res,
          "Une prescription existe déjà pour cette consultation",
        );

      const numero_ordonnance = generateNumeroOrdonnance();
      const prescription = await Prescription.create({
        id_consultation,
        id_medecin: req.user.id,
        id_dossier: consultation.id_dossier,
        numero_ordonnance,
        instructions_generales,
      });

      // Créer ou trouver les médicaments et les associer à la prescription
      const medsAssocies = [];
      for (const medData of medicaments) {
        // Trouver ou créer le médicament
        const medicament = await medicamentService.findOrCreate({
          nom: medData.nom_medicament,
          dosage: medData.dosage,
          forme: medData.forme,
        });

        // Créer l'association avec les détails de prescription
        const medPrescrit = await MedicamentPrescrit.create({
          id_prescription: prescription.id,
          id_medicament: medicament.id,
          frequence: medData.frequence,
          duree_jours: medData.duree_jours,
          instructions: medData.instructions,
        });

        medsAssocies.push({
          ...medicament.toJSON(),
          MedicamentPrescrit: medPrescrit.toJSON(),
        });
      }

      // Générer PDF
      const medecin = await Utilisateur.findByPk(req.user.id, {
        include: [{ association: "professionnel" }],
      });
      const dossier = await DossierMedical.findByPk(consultation.id_dossier, {
        include: [{ association: "patient" }],
      });
      const pdfBuffer = await pdfService.genererOrdonnance(
        prescription,
        medecin,
        dossier.patient,
        medsAssocies,
        dossier.numero_dossier,
      );
      const pdfUrl = await pdfService.sauvegarder(
        pdfBuffer,
        `ordonnance_${numero_ordonnance}.pdf`,
        "prescriptions",
      );
      await prescription.update({ pdf_url: pdfUrl });

      // Notifier patient
      notificationService
        .creer({
          id_utilisateur: dossier.id_patient,
          type: "prescription",
          titre: "Nouvelle ordonnance disponible",
          contenu: `Dr. ${medecin.prenom} ${medecin.nom} vous a prescrit une ordonnance.`,
          lien: `/patient/dossier`,
        })
        .catch(() => {});

      await auditService.log({
        id_utilisateur: req.user.id,
        action: ACTIONS_AUDIT.CREATION_PRESCRIPTION,
        ip: req.ip,
        details: { id_prescription: prescription.id },
      });

      return created(
        res,
        { prescription, medicaments: medsAssocies, pdfUrl },
        "Prescription créée",
      );
    } catch (err) {
      next(err);
    }
  },

  async getById(req, res, next) {
    try {
      const prescription = await Prescription.findByPk(req.params.id, {
        include: [
          {
            model: Medicament,
            as: "medicaments",
            through: {
              attributes: ["frequence", "duree_jours", "instructions"],
            },
          },
        ],
      });
      if (!prescription) return notFound(res, "Prescription introuvable");
      return success(res, { prescription });
    } catch (err) {
      next(err);
    }
  },

  async getPDF(req, res, next) {
    try {
      const prescription = await Prescription.findByPk(req.params.id);
      if (!prescription) return notFound(res, "Prescription introuvable");
      if (!prescription.pdf_url) return notFound(res, "PDF non disponible");

      const filepath = `.${prescription.pdf_url}`;
      return res.sendFile(filepath, { root: "." });
    } catch (err) {
      next(err);
    }
  },

  async renouveler(req, res, next) {
    try {
      const {
        id_prescription_source,
        id_dossier,
        motif_consultation,
        diagnostic_consultation,
        medicaments,
        instructions_generales,
      } = req.body;

      if (!id_dossier || !motif_consultation || !medicaments?.length) {
        return res.status(400).json({
          success: false,
          message: "Données manquantes pour le renouvellement",
        });
      }

      // Vérifier l'accès au dossier
      const dossier = await DossierMedical.findByPk(id_dossier);
      if (!dossier) return notFound(res, "Dossier introuvable");

      // Créer une nouvelle consultation pour ce renouvellement
      const { AccesDossier } = require("../models");
      const hasAccess = await AccesDossier.findOne({
        where: { id_dossier, id_professionnel: req.user.id, statut: "actif" },
      });
      const alreadyConsulted = await Consultation.findOne({
        where: { id_dossier, id_medecin: req.user.id },
      });
      if (!hasAccess && !alreadyConsulted) {
        return forbidden(res, "Accès insuffisant pour ce dossier");
      }

      const nouvelleConsultation = await Consultation.create({
        id_dossier,
        id_medecin: req.user.id,
        motif: motif_consultation || "Renouvellement de traitement",
        diagnostic: diagnostic_consultation || "Renouvellement de traitement",
        type_consultation: "presentiel",
      });

      await dossier.update({ date_mise_a_jour: new Date() });

      // Créer la nouvelle prescription
      const numero_ordonnance = generateNumeroOrdonnance();
      const prescription = await Prescription.create({
        id_consultation: nouvelleConsultation.id,
        id_medecin: req.user.id,
        id_dossier,
        numero_ordonnance,
        instructions_generales,
      });

      const medsAssocies = [];
      for (const medData of medicaments) {
        const medicament = await medicamentService.findOrCreate({
          nom: medData.nom_medicament,
          dosage: medData.dosage,
          forme: medData.forme,
        });
        const medPrescrit = await MedicamentPrescrit.create({
          id_prescription: prescription.id,
          id_medicament: medicament.id,
          frequence: medData.frequence,
          duree_jours: medData.duree_jours,
          instructions: medData.instructions,
        });
        medsAssocies.push({
          ...medicament.toJSON(),
          MedicamentPrescrit: medPrescrit.toJSON(),
        });
      }

      // Générer PDF
      try {
        const medecin = await Utilisateur.findByPk(req.user.id, {
          include: [{ association: "professionnel" }],
        });
        const dossierAvecPatient = await DossierMedical.findByPk(id_dossier, {
          include: [{ association: "patient" }],
        });
        const pdfBuffer = await pdfService.genererOrdonnance(
          prescription,
          medecin,
          dossierAvecPatient.patient,
          medsAssocies,
          dossierAvecPatient.numero_dossier,
        );
        const pdfUrl = await pdfService.sauvegarder(
          pdfBuffer,
          `ordonnance_${numero_ordonnance}.pdf`,
          "prescriptions",
        );
        await prescription.update({ pdf_url: pdfUrl });
      } catch {}

      notificationService
        .creer({
          id_utilisateur: dossier.id_patient,
          type: "prescription",
          titre: "Ordonnance renouvelée",
          contenu: `Dr. ${req.user.prenom} ${req.user.nom} a renouvelé votre ordonnance.`,
          lien: "/patient/dossier",
        })
        .catch(() => {});

      await auditService.log({
        id_utilisateur: req.user.id,
        action: ACTIONS_AUDIT.CREATION_PRESCRIPTION,
        ip: req.ip,
        details: { id_prescription: prescription.id, renouvellement: true },
      });

      return created(
        res,
        {
          prescription,
          consultation: nouvelleConsultation,
          medicaments: medsAssocies,
        },
        "Prescription renouvelée",
      );
    } catch (err) {
      next(err);
    }
  },

  async updateStatut(req, res, next) {
    try {
      const prescription = await Prescription.findByPk(req.params.id);
      if (!prescription) return notFound(res, "Prescription introuvable");
      if (prescription.id_medecin !== req.user.id) return forbidden(res);

      await prescription.update({ statut: req.body.statut });
      return success(res, { prescription }, "Statut mis à jour");
    } catch (err) {
      next(err);
    }
  },

  async delete(req, res, next) {
    try {
      const prescription = await Prescription.findByPk(req.params.id);
      if (!prescription) return notFound(res, "Prescription introuvable");
      if (prescription.id_medecin !== req.user.id) {
        return forbidden(res, "Seul le médecin auteur peut supprimer cette prescription");
      }

      // Supprimer d'abord les associations
      await MedicamentPrescrit.destroy({
        where: { id_prescription: prescription.id },
      });

      // Supprimer le fichier PDF si existant
      if (prescription.pdf_url) {
        const fs = require("fs");
        const filepath = `.${prescription.pdf_url}`;
        if (fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
        }
      }

      // Supprimer la prescription
      await prescription.destroy();

      await auditService.log({
        id_utilisateur: req.user.id,
        action: ACTIONS_AUDIT.SUPPRESSION_PRESCRIPTION,
        ip: req.ip,
        details: { id_prescription: req.params.id },
      });

      return success(res, null, "Prescription supprimée");
    } catch (err) {
      next(err);
    }
  },
};

module.exports = { prescriptionController };
