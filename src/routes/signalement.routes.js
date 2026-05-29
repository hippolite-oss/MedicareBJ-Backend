/**
 * routes/signalement.routes.js
 */
const router = require('express').Router();
const { signalementController } = require('../controllers/signalement.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createSignalementSchema, traiterSignalementSchema } = require('../validations/signalement.validation');

router.post('/', authenticate, requireRole('patient', 'usager', 'medecin', 'technicien'), validate(createSignalementSchema), signalementController.create);
router.get('/en-attente/count', authenticate, requireRole('admin'), signalementController.countEnAttente);
router.get('/', authenticate, requireRole('admin'), signalementController.list);
router.get('/:id', authenticate, requireRole('admin'), signalementController.getById);
router.patch('/:id/traiter', authenticate, requireRole('admin'), validate(traiterSignalementSchema), signalementController.traiter);

module.exports = router;
