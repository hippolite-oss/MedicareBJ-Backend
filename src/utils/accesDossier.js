/**
 * utils/accesDossier.js — Vérification d'accès à un dossier médical
 */
const { DossierMedical, AccesDossier } = require("../models");

class AccesDossierError extends Error {
  constructor(message, statusCode = 403) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AccesDossierError";
  }
}

/**
 * @returns {{ dossier: object, acces?: object }}
 */
async function verifierAccesUtilisateur(user, id_dossier, typeAcces = "lecture") {
  if (!id_dossier) {
    throw new AccesDossierError("Identifiant dossier manquant", 400);
  }

  const dossier = await DossierMedical.findByPk(id_dossier);
  if (!dossier) {
    throw new AccesDossierError("Dossier médical introuvable", 404);
  }

  if (user.role === "admin") {
    return { dossier };
  }

  if (user.role === "patient" || user.role === "usager") {
    if (dossier.id_patient !== user.id) {
      throw new AccesDossierError("Accès refusé à ce dossier");
    }
    return { dossier };
  }

  if (user.role === "medecin" || user.role === "technicien") {
    const acces = await AccesDossier.findOne({
      where: {
        id_dossier,
        id_professionnel: user.id,
        statut: "actif",
      },
    });

    if (!acces) {
      throw new AccesDossierError("Aucun accès autorisé à ce dossier");
    }

    if (acces.date_fin && new Date(acces.date_fin) < new Date()) {
      await acces.update({ statut: "expire" });
      throw new AccesDossierError("Accès expiré");
    }

    if (typeAcces === "ecriture" && acces.type_acces !== "ecriture") {
      throw new AccesDossierError("Accès en lecture seule — modification impossible");
    }

    return { dossier, acces };
  }

  throw new AccesDossierError("Rôle non autorisé");
}

module.exports = { verifierAccesUtilisateur, AccesDossierError };
