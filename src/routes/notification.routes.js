/**
 * routes/notification.routes.js
 */
const router = require('express').Router();
const { notificationController } = require('../controllers/notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { countRateLimit } = require('../middlewares/rateLimit.middleware');

router.get('/', authenticate, notificationController.list);
router.get('/count-non-lues', authenticate, countRateLimit, notificationController.countNonLues);
router.patch('/tout-lire', authenticate, notificationController.toutLire);
router.patch('/:id/lire', authenticate, notificationController.marquerLue);
router.delete('/:id', authenticate, notificationController.delete);

module.exports = router;
