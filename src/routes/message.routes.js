/**
 * routes/message.routes.js
 */
const router = require("express").Router();
const { messageController } = require("../controllers/message.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { countRateLimit } = require("../middlewares/rateLimit.middleware");

router.get("/conversations", authenticate, messageController.conversations);
router.get(
  "/conversation/:id_utilisateur",
  authenticate,
  messageController.conversation,
);
router.get(
  "/count-non-lus",
  authenticate,
  countRateLimit,
  messageController.countNonLus,
);
router.post("/envoyer", authenticate, messageController.envoyer);
router.delete("/:id", authenticate, messageController.supprimer);
router.patch(
  "/marquer-lu/:id_expediteur",
  authenticate,
  messageController.marquerLu,
);

module.exports = router;
