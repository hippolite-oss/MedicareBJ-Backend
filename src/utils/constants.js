/**
 * utils/constants.js — Constantes globales
 */

const ROLES = {
  PATIENT: 'patient',
  USAGER: 'usager',
  MEDECIN: 'medecin',
  TECHNICIEN: 'technicien',
  ADMIN: 'admin',
};

const STATUTS_COMPTE = {
  ACTIF: 'actif',
  EN_ATTENTE: 'en_attente',
  SUSPENDU: 'suspendu',
  SUPPRIME: 'supprime',
};

const STATUTS_VALIDATION = {
  EN_ATTENTE: 'en_attente',
  VALIDE: 'valide',
  REJETE: 'rejete',
};

const STATUTS_RDV = {
  PLANIFIE: 'planifie',
  CONFIRME: 'confirme',
  ANNULE: 'annule',
  TERMINE: 'termine',
};

const STATUTS_PAIEMENT = {
  EN_ATTENTE: 'en_attente',
  COMPLETE: 'complete',
  ECHOUE: 'echoue',
  REMBOURSE: 'rembourse',
};

const MODES_PAIEMENT = {
  MTN: 'mtn_money',
  MOOV: 'moov_money',
  CINETPAY: 'cinetpay',
  ESPECES: 'especes',
};

const STATUTS_QR = {
  ACTIF: 'actif',
  UTILISE: 'utilise',
  EXPIRE: 'expire',
  REVOQUE: 'revoque',
};

const TYPES_ACCES = {
  LECTURE: 'lecture',
  ECRITURE: 'ecriture',
};

const TYPES_NOTIFICATION = {
  CONSULTATION: 'consultation',
  PRESCRIPTION: 'prescription',
  ANALYSE: 'analyse',
  RDV: 'rdv',
  PAIEMENT: 'paiement',
  MESSAGE: 'message',
  ACCES: 'acces',
  VALIDATION: 'validation',
  SIGNALEMENT: 'signalement',
  SYSTEME: 'systeme',
};

const ACTIONS_AUDIT = {
  CONNEXION: 'CONNEXION',
  DECONNEXION: 'DECONNEXION',
  ACCES_DOSSIER: 'ACCES_DOSSIER',
  SCAN_QR: 'SCAN_QR',
  CREATION_CONSULTATION: 'CREATION_CONSULTATION',
  CREATION_PRESCRIPTION: 'CREATION_PRESCRIPTION',
  SUPPRESSION_PRESCRIPTION: 'SUPPRESSION_PRESCRIPTION',
  VALIDATION_MEDECIN: 'VALIDATION_MEDECIN',
  REJET_MEDECIN: 'REJET_MEDECIN',
  SUSPENSION_COMPTE: 'SUSPENSION_COMPTE',
  REVOCATION_ACCES: 'REVOCATION_ACCES',
  TRAITEMENT_SIGNALEMENT: 'TRAITEMENT_SIGNALEMENT',
  MODIFICATION_DOSSIER: 'MODIFICATION_DOSSIER',
  PAIEMENT: 'PAIEMENT',
  RESET_PASSWORD: 'RESET_PASSWORD',
};

const SPECIALITES = [
  'Médecin généraliste', 'Cardiologue', 'Pédiatre', 'Radiologue',
  'Neurologue', 'Gynécologue', 'Dermatologue', 'Ophtalmologue',
  'Technicien de laboratoire', 'Technicien de radiologie',
  'Chirurgien', 'Urologue', 'Pneumologue', 'Endocrinologue',
  'Rhumatologue', 'Psychiatre', 'Anesthésiste', 'Urgentiste',
];

module.exports = {
  ROLES, STATUTS_COMPTE, STATUTS_VALIDATION, STATUTS_RDV,
  STATUTS_PAIEMENT, MODES_PAIEMENT, STATUTS_QR, TYPES_ACCES,
  TYPES_NOTIFICATION, ACTIONS_AUDIT, SPECIALITES,
};
