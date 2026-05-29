/**
 * routes/notification.routes.js — avec headers de cache
 */
const router = require("express").Router();
const {
  notificationController,
} = require("../controllers/notification.controller");
const { authenticate } = require("../middlewares/auth.middleware");
const { countRateLimit } = require("../middlewares/rateLimit.middleware");
const {
  cacheMedium,
  noCache,
} = require("../middlewares/cacheHeaders.middleware");

// Liste des notifications — cache 2min
router.get("/", authenticate, cacheMedium, notificationController.list);

// Compteur — pas de cache (mis à jour en temps réel par socket)
router.get(
  "/count-non-lues",
  authenticate,
  countRateLimit,
  noCache,
  notificationController.countNonLues,
);

router.patch("/tout-lire", authenticate, notificationController.toutLire);
router.patch("/:id/lire", authenticate, notificationController.marquerLue);
router.delete("/:id", authenticate, notificationController.delete);

module.exports = router;
