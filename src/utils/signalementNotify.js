/**
 * Helpers notifications signalements
 */
const { Utilisateur } = require("../models");
const { notificationService } = require("../services/notification.service");

const DECISION_LABELS = {
  avertissement: "Avertissement",
  suspension_30j: "Suspension 30 jours",
  suspension_definitive: "Suspension définitive",
  rejete: "Signalement rejeté",
};

function formatDecisionLabel(decision) {
  return DECISION_LABELS[decision] || decision;
}

function buildContenuTraitement(decision, decision_admin) {
  const label = formatDecisionLabel(decision);
  const commentaire = decision_admin?.trim();
  let contenu = `Décision : ${label}.`;
  if (commentaire) {
    contenu += `\n\nCommentaire de l'administration :\n${commentaire}`;
  }
  return contenu;
}

async function notifierTousLesAdmins({
  type = "signalement",
  titre,
  contenu,
  lien = "/admin/signalements",
  metadata = null,
}) {
  const admins = await Utilisateur.findAll({
    where: { role: "admin", statut: "actif" },
    attributes: ["id"],
  });
  await Promise.all(
    admins.map((admin) =>
      notificationService.creer({
        id_utilisateur: admin.id,
        type,
        titre,
        contenu,
        lien,
        metadata,
      }),
    ),
  );
}

module.exports = {
  DECISION_LABELS,
  formatDecisionLabel,
  buildContenuTraitement,
  notifierTousLesAdmins,
};
