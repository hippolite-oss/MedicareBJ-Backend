/**
 * routes/hopital.routes.js
 */
const router = require('express').Router();
const { hopitalController } = require('../controllers/hopital.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/', hopitalController.list); // public
router.get('/:id', hopitalController.getById); // public
router.post('/', authenticate, requireRole('admin'), hopitalController.create);
router.patch('/:id', authenticate, requireRole('admin'), hopitalController.update);
router.patch('/:id/statut', authenticate, requireRole('admin'), hopitalController.updateStatut);
router.delete('/:id', authenticate, requireRole('admin'), hopitalController.delete);

module.exports = router;
