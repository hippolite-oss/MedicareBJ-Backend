/**
 * routes/upload.routes.js
 */
const router = require("express").Router();
const { authenticate } = require("../middlewares/auth.middleware");
const { requireRole } = require("../middlewares/role.middleware");
const {
  utilisateurController,
} = require("../controllers/utilisateur.controller");
const { analyseController } = require("../controllers/analyse.controller");
const { messageController } = require("../controllers/message.controller");
const {
  uploadAvatar,
  uploadAnalyse,
  uploadMessageMedia,
} = require("../config/multer");

router.post(
  "/avatar",
  authenticate,
  uploadAvatar.single("image"),
  utilisateurController.uploadAvatar,
);
router.post(
  "/analyse/:id_analyse",
  authenticate,
  requireRole("technicien"),
  uploadAnalyse.single("fichier"),
  analyseController.updateResultats,
);
router.post(
  "/message-media",
  authenticate,
  uploadMessageMedia.single("fichier"),
  messageController.uploadMedia,
);

module.exports = router;
