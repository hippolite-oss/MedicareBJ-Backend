/**
 * routes/medicament.routes.js
 */
const express = require('express');
const router = express.Router();
const { medicamentController } = require('../controllers/medicament.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createMedicamentSchema, updateMedicamentSchema } = require('../validations/medicament.validation');

// Routes accessibles aux professionnels de santé
router.get('/search', authenticate, requireRole('medecin', 'technicien', 'admin'), medicamentController.search);
router.get('/', authenticate, requireRole('medecin', 'technicien', 'admin'), medicamentController.getAll);
router.get('/:id', authenticate, requireRole('medecin', 'technicien', 'admin'), medicamentController.getById);

// Routes réservées aux admins
router.post('/', authenticate, requireRole('admin'), validate(createMedicamentSchema), medicamentController.create);
router.put('/:id', authenticate, requireRole('admin'), validate(updateMedicamentSchema), medicamentController.update);
router.delete('/:id', authenticate, requireRole('admin'), medicamentController.delete);

module.exports = router;
