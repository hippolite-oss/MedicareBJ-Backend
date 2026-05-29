/**
 * routes/message.routes.js — avec headers de cache
 */
const router = require("express").Router();
const { messageController } = require("../controllers/message.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { countRateLimit } = require("../middlewares/rateLimit.middleware");
const {
  cacheMedium,
  cacheShort,
  noCache,
} = require("../middlewares/cacheHeaders.middleware");

// Conversations — cache 2min
router.get(
  "/conversations",
  authenticate,
  cacheMedium,
  messageController.conversations,
);

// Messages d'une conversation — cache 30s
router.get(
  "/conversation/:id_utilisateur",
  authenticate,
  cacheShort,
  messageController.conversation,
);

// Compteur non lus — pas de cache (mis à jour par socket)
router.get(
  "/count-non-lus",
  authenticate,
  countRateLimit,
  noCache,
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
