/**
 * routes/paiement.routes.js
 */
const router = require('express').Router();
const { paiementController } = require('../controllers/paiement.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { initierPaiementSchema } = require('../validations/paiement.validation');

router.post('/initier', authenticate, requireRole('patient', 'usager'), validate(initierPaiementSchema), paiementController.initier);
router.post('/webhook/cinetpay', paiementController.webhookCinetPay); // sans auth
router.post('/webhook/mtn', paiementController.webhookMTN); // sans auth
router.get('/mes-paiements', authenticate, requireRole('patient', 'usager'), paiementController.mesPaiements);
router.get('/:id/recu', authenticate, paiementController.getRecu);
router.get('/', authenticate, requireRole('admin'), paiementController.listAdmin);

module.exports = router;
