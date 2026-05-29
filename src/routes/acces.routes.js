/**
 * routes/acces.routes.js
 */
const router = require('express').Router();
const { accesController } = require('../controllers/acces.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/mon-dossier', authenticate, requireRole('patient', 'usager'), accesController.monDossierAcces);
router.post('/accorder', authenticate, requireRole('patient', 'usager'), accesController.accorder);
router.patch('/:id/revoquer', authenticate, accesController.revoquer);
router.get('/journal', authenticate, requireRole('patient', 'usager'), accesController.journal);

module.exports = router;
