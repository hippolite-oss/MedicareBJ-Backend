/**
 * routes/admin.routes.js
 */
const router = require('express').Router();
const { adminController } = require('../controllers/admin.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

const isAdmin = [authenticate, requireRole('admin')];

router.get('/stats', ...isAdmin, adminController.stats);
router.get('/validations/en-attente', ...isAdmin, adminController.validationsEnAttente);
router.post('/validations/:id/valider', ...isAdmin, adminController.validerMedecin);
router.post('/validations/:id/rejeter', ...isAdmin, adminController.rejeterMedecin);
router.get('/droits-acces', ...isAdmin, adminController.droitsAcces);
router.patch('/droits-acces/:id/revoquer', ...isAdmin, adminController.revoquerAcces);

module.exports = router;
