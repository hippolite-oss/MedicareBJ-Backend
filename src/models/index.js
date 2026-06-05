/**
 * models/index.js — Chargement et associations entre modèles Sequelize
 */
const Utilisateur = require("./Utilisateur");
const Patient = require("./Patient");
const Professionnel = require("./Professionnel");
const Hopital = require("./Hopital");
const DossierMedical = require("./DossierMedical");
const CodeQR = require("./CodeQR");
const AccesDossier = require("./AccesDossier");
const Consultation = require("./Consultation");
const Prescription = require("./Prescription");
const Medicament = require("./Medicament");
const MedicamentPrescrit = require("./MedicamentPrescrit");
const Analyse = require("./Analyse");
const RendezVous = require("./RendezVous");
const AgendaMedecin = require("./AgendaMedecin");
const Paiement = require("./Paiement");
const Message = require("./Message");
const Notification = require("./Notification");
const Signalement = require("./Signalement");
const JournalAudit = require("./JournalAudit");
const RefreshToken = require("./RefreshToken");

// ── Utilisateur ──────────────────────────────────────────
Utilisateur.hasOne(Patient, {
  foreignKey: "id_utilisateur",
  as: "patient",
  onDelete: "CASCADE",
});
Patient.belongsTo(Utilisateur, { foreignKey: "id_utilisateur" });

Utilisateur.hasOne(Professionnel, {
  foreignKey: "id_utilisateur",
  as: "professionnel",
  onDelete: "CASCADE",
});
Professionnel.belongsTo(Utilisateur, {
  foreignKey: "id_utilisateur",
  as: "utilisateur",
});

Utilisateur.hasOne(DossierMedical, {
  foreignKey: "id_patient",
  as: "dossier",
  onDelete: "CASCADE",
});
DossierMedical.belongsTo(Utilisateur, {
  foreignKey: "id_patient",
  as: "patient",
});

Utilisateur.hasMany(RendezVous, {
  as: "rdv_patient",
  foreignKey: "id_patient",
});
Utilisateur.hasMany(RendezVous, {
  as: "rdv_medecin",
  foreignKey: "id_medecin",
});
RendezVous.belongsTo(Utilisateur, { as: "patient", foreignKey: "id_patient" });
RendezVous.belongsTo(Utilisateur, { as: "medecin", foreignKey: "id_medecin" });

Utilisateur.hasMany(Message, {
  as: "messages_envoyes",
  foreignKey: "id_expediteur",
});
Utilisateur.hasMany(Message, {
  as: "messages_recus",
  foreignKey: "id_destinataire",
});
Message.belongsTo(Utilisateur, {
  as: "expediteur",
  foreignKey: "id_expediteur",
});
Message.belongsTo(Utilisateur, {
  as: "destinataire",
  foreignKey: "id_destinataire",
});

Utilisateur.hasMany(Notification, {
  foreignKey: "id_utilisateur",
  as: "notifications",
});
Notification.belongsTo(Utilisateur, { foreignKey: "id_utilisateur" });

Utilisateur.hasMany(JournalAudit, {
  foreignKey: "id_utilisateur",
  as: "audit",
});
JournalAudit.belongsTo(Utilisateur, { foreignKey: "id_utilisateur" });

Utilisateur.hasMany(RefreshToken, { foreignKey: "id_utilisateur" });
RefreshToken.belongsTo(Utilisateur, { foreignKey: "id_utilisateur" });

// ── Hôpital ───────────────────────────────────────────────
Hopital.hasMany(Professionnel, {
  foreignKey: "id_hopital",
  as: "professionnels",
});
Professionnel.belongsTo(Hopital, { foreignKey: "id_hopital", as: "hopital" });

Hopital.hasMany(RendezVous, { foreignKey: "id_hopital" });
RendezVous.belongsTo(Hopital, { foreignKey: "id_hopital", as: "hopital" });

Hopital.hasMany(Consultation, { foreignKey: "id_hopital" });
Consultation.belongsTo(Hopital, { foreignKey: "id_hopital", as: "hopital" });

// ── Dossier Médical ───────────────────────────────────────
DossierMedical.hasMany(CodeQR, { foreignKey: "id_dossier", as: "codes_qr" });
CodeQR.belongsTo(DossierMedical, { foreignKey: "id_dossier" });

DossierMedical.hasMany(AccesDossier, { foreignKey: "id_dossier", as: "acces" });
AccesDossier.belongsTo(DossierMedical, { foreignKey: "id_dossier" });

DossierMedical.hasMany(Consultation, {
  foreignKey: "id_dossier",
  as: "consultations",
});
Consultation.belongsTo(DossierMedical, {
  foreignKey: "id_dossier",
  as: "dossier",
});

DossierMedical.hasMany(Analyse, { foreignKey: "id_dossier", as: "analyses" });
Analyse.belongsTo(DossierMedical, { foreignKey: "id_dossier", as: "dossier" });
Analyse.belongsTo(Utilisateur, {
  foreignKey: "id_medecin_demandeur",
  as: "demandeur",
});
Analyse.belongsTo(Utilisateur, {
  foreignKey: "id_technicien",
  as: "realisateur",
});

DossierMedical.hasMany(Prescription, {
  foreignKey: "id_dossier",
  as: "prescriptions",
});
Prescription.belongsTo(DossierMedical, { foreignKey: "id_dossier" });

// ── Consultation ──────────────────────────────────────────
Consultation.hasOne(Prescription, {
  foreignKey: "id_consultation",
  as: "prescription",
});
Prescription.belongsTo(Consultation, { foreignKey: "id_consultation" });

Consultation.hasMany(Analyse, {
  foreignKey: "id_consultation",
  as: "analyses",
});
Analyse.belongsTo(Consultation, {
  foreignKey: "id_consultation",
  as: "consultation",
});

Consultation.belongsTo(Utilisateur, {
  as: "medecin",
  foreignKey: "id_medecin",
});

// ── Prescription ──────────────────────────────────────────
Prescription.belongsTo(Utilisateur, {
  as: "medecin",
  foreignKey: "id_medecin",
});
Utilisateur.hasMany(Prescription, {
  as: "prescriptions",
  foreignKey: "id_medecin",
});

// Relation many-to-many entre Prescription et Medicament via MedicamentPrescrit
Prescription.belongsToMany(Medicament, {
  through: MedicamentPrescrit,
  foreignKey: "id_prescription",
  otherKey: "id_medicament",
  as: "medicaments",
});

Medicament.belongsToMany(Prescription, {
  through: MedicamentPrescrit,
  foreignKey: "id_medicament",
  otherKey: "id_prescription",
  as: "prescriptions",
});

// Relations directes pour accéder aux détails de la table d'association
Prescription.hasMany(MedicamentPrescrit, {
  foreignKey: "id_prescription",
  as: "medicaments_prescrits",
});
MedicamentPrescrit.belongsTo(Prescription, { foreignKey: "id_prescription" });

Medicament.hasMany(MedicamentPrescrit, {
  foreignKey: "id_medicament",
  as: "prescriptions_associees",
});
MedicamentPrescrit.belongsTo(Medicament, { foreignKey: "id_medicament" });

// ── Rendez-vous ───────────────────────────────────────────
RendezVous.hasOne(AgendaMedecin, { foreignKey: "id_rdv", as: "agenda" });
AgendaMedecin.belongsTo(RendezVous, { foreignKey: "id_rdv" });

RendezVous.hasOne(Paiement, { foreignKey: "id_rdv", as: "paiement" });
Paiement.belongsTo(RendezVous, { foreignKey: "id_rdv", as: "rendezvous" });

Consultation.hasOne(Paiement, {
  foreignKey: "id_consultation",
  as: "paiement",
});
Paiement.belongsTo(Consultation, { foreignKey: "id_consultation" });

Paiement.belongsTo(Utilisateur, { as: "patient", foreignKey: "id_patient" });

// ── AccesDossier ──────────────────────────────────────────
AccesDossier.belongsTo(Utilisateur, {
  as: "professionnel",
  foreignKey: "id_professionnel",
});

// ── Signalement ───────────────────────────────────────────
Signalement.belongsTo(Utilisateur, {
  as: "emetteur",
  foreignKey: "id_emetteur",
});
Signalement.belongsTo(Utilisateur, { as: "cible", foreignKey: "id_cible" });

// ── AgendaMedecin ─────────────────────────────────────────
AgendaMedecin.belongsTo(Utilisateur, {
  as: "medecin",
  foreignKey: "id_medecin",
});

module.exports = {
  Utilisateur,
  Patient,
  Professionnel,
  Hopital,
  DossierMedical,
  CodeQR,
  AccesDossier,
  Consultation,
  Prescription,
  Medicament,
  MedicamentPrescrit,
  Analyse,
  RendezVous,
  AgendaMedecin,
  Paiement,
  Message,
  Notification,
  Signalement,
  JournalAudit,
  RefreshToken,
};
