/**
 * routes/utilisateur.routes.js
 */
const router = require("express").Router();
const {
  utilisateurController,
} = require("../controllers/utilisateur.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { validate } = require("../middlewares/validate.middleware");
const {
  updateUtilisateurSchema,
  updateStatutSchema,
  updatePasswordSchema,
} = require("../validations/utilisateur.validation");
const { uploadAvatar } = require("../config/multer");

router.get("/", authenticate, requireRole("admin"), utilisateurController.list);
// Médecins publics — accessible à tous les utilisateurs authentifiés (pour la messagerie)
router.get(
  "/medecins/publics",
  authenticate,
  utilisateurController.listMedecinsPublics,
);
router.get(
  "/patients/recherche",
  authenticate,
  requireRole("medecin", "technicien"),
  utilisateurController.rechercherPatientsAutorises,
);
router.get("/:id", authenticate, utilisateurController.getById);
router.patch(
  "/:id",
  authenticate,
  validate(updateUtilisateurSchema),
  utilisateurController.update,
);
router.patch(
  "/:id/password",
  authenticate,
  validate(updatePasswordSchema),
  utilisateurController.updatePassword,
);
router.patch(
  "/:id/profil-pro",
  authenticate,
  utilisateurController.updateProfilPro,
);
router.patch(
  "/:id/statut",
  authenticate,
  requireRole("admin"),
  validate(updateStatutSchema),
  utilisateurController.updateStatut,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  utilisateurController.delete,
);
router.post(
  "/avatar",
  authenticate,
  uploadAvatar.single("image"),
  utilisateurController.uploadAvatar,
);

module.exports = router;
