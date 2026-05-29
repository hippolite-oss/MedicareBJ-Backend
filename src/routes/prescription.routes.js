/**
 * routes/prescription.routes.js
 */
const router = require("express").Router();
const {
  prescriptionController,
} = require("../controllers/prescription.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const { validate } = require("../middlewares/validate.middleware");
const {
  createPrescriptionSchema,
} = require("../validations/prescription.validation");

router.post(
  "/",
  authenticate,
  requireRole("medecin"),
  validate(createPrescriptionSchema),
  prescriptionController.create,
);
router.post(
  "/renouveler",
  authenticate,
  requireRole("medecin"),
  prescriptionController.renouveler,
);
router.get("/:id", authenticate, prescriptionController.getById);
router.get("/:id/pdf", authenticate, prescriptionController.getPDF);
router.patch(
  "/:id/statut",
  authenticate,
  requireRole("medecin"),
  prescriptionController.updateStatut,
);
router.delete(
  "/:id",
  authenticate,
  requireRole("medecin"),
  prescriptionController.delete,
);

module.exports = router;
