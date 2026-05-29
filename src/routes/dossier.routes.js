/**
 * routes/dossier.routes.js
 */
const router = require("express").Router();
const { dossierController } = require("../controllers/dossier.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { verifierAccesDossier } = require("../middlewares/acces.middleware");
const { validate } = require("../middlewares/validate.middleware");
const { updatePatientSchema } = require("../validations/dossier.validation");

router.get("/mon-dossier", authenticate, dossierController.monDossier);
router.get(
  "/medecin/mes-patients",
  authenticate,
  requireRole("medecin", "technicien"),
  dossierController.mesPatients,
);
router.get(
  "/:id",
  authenticate,
  verifierAccesDossier("lecture"),
  dossierController.getById,
);
router.get(
  "/:id/consultations",
  authenticate,
  verifierAccesDossier("lecture"),
  dossierController.getConsultations,
);
router.get(
  "/:id/prescriptions",
  authenticate,
  verifierAccesDossier("lecture"),
  dossierController.getPrescriptions,
);
router.get(
  "/:id/analyses",
  authenticate,
  verifierAccesDossier("lecture"),
  dossierController.getAnalyses,
);
router.patch(
  "/:id/profil-medical",
  authenticate,
  verifierAccesDossier("ecriture"),
  validate(updatePatientSchema),
  dossierController.updateProfilMedical,
);

module.exports = router;
