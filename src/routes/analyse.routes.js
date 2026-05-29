/**
 * routes/analyse.routes.js
 */
const router = require("express").Router();
const { analyseController } = require("../controllers/analyse.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { uploadAnalyse } = require("../config/multer");

router.get(
  "/medecin/mes-analyses",
  authenticate,
  requireRole("medecin", "technicien"),
  analyseController.mesAnalyses,
);
router.post(
  "/",
  authenticate,
  requireRole("medecin"),
  analyseController.create,
);
// Résultats sans fichier (JSON) — médecin et technicien
router.patch(
  "/:id/resultats",
  authenticate,
  requireRole("technicien", "medecin"),
  analyseController.updateResultats,
);
// Résultats avec fichier (multipart) — technicien
router.patch(
  "/:id/resultats/fichier",
  authenticate,
  requireRole("technicien", "medecin"),
  uploadAnalyse.single("fichier"),
  analyseController.updateResultats,
);
router.get("/:id", authenticate, analyseController.getById);
router.get("/:id/fichier", authenticate, analyseController.getFichier);

module.exports = router;
