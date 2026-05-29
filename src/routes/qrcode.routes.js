/**
 * routes/qrcode.routes.js
 */
const router = require('express').Router();
const { qrcodeController } = require('../controllers/qrcode.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.post('/generer', authenticate, requireRole('patient', 'usager'), qrcodeController.generer);
router.get('/mes-codes', authenticate, requireRole('patient', 'usager'), qrcodeController.mesCodes);
router.get('/:id/historique', authenticate, requireRole('patient', 'usager'), qrcodeController.historiqueScans);
router.post('/scanner', authenticate, requireRole('medecin', 'technicien'), qrcodeController.scanner);
router.patch('/:id/revoquer', authenticate, requireRole('patient', 'usager'), qrcodeController.revoquer);
router.delete('/:id', authenticate, requireRole('patient', 'usager'), qrcodeController.supprimer);

module.exports = router;
