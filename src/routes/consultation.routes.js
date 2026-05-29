/**
 * routes/consultation.routes.js
 */
const router = require('express').Router();
const { consultationController } = require('../controllers/consultation.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createConsultationSchema, updateConsultationSchema } = require('../validations/consultation.validation');

router.post('/', authenticate, requireRole('medecin'), validate(createConsultationSchema), consultationController.create);
router.get('/medecin/mes-consultations', authenticate, requireRole('medecin'), consultationController.mesConsultations);
router.get('/:id', authenticate, consultationController.getById);
router.patch('/:id', authenticate, requireRole('medecin'), validate(updateConsultationSchema), consultationController.update);

module.exports = router;
