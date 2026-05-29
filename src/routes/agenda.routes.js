/**
 * routes/agenda.routes.js
 */
const router = require('express').Router();
const { agendaController } = require('../controllers/agenda.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/mon-agenda', authenticate, requireRole('medecin'), agendaController.monAgenda);
router.post('/bloquer', authenticate, requireRole('medecin'), agendaController.bloquer);
router.patch('/:id', authenticate, requireRole('medecin'), agendaController.update);
router.delete('/:id', authenticate, requireRole('medecin'), agendaController.delete);

module.exports = router;
