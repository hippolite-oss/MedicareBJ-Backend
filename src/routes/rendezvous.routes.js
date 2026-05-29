/**
 * routes/rendezvous.routes.js
 */
const router = require('express').Router();
const { rendezvousController } = require('../controllers/rendezvous.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');
const { validate } = require('../middlewares/validate.middleware');
const { createRdvSchema, updateRdvStatutSchema } = require('../validations/rendezvous.validation');

router.get('/medecins-disponibles', authenticate, rendezvousController.medecinsDisponibles);
router.get('/disponibilites/:id_medecin', authenticate, rendezvousController.disponibilites);
router.post('/', authenticate, requireRole('patient', 'usager'), validate(createRdvSchema), rendezvousController.create);
router.get('/mes-rdv', authenticate, requireRole('patient', 'usager'), rendezvousController.mesRdv);
router.get('/agenda-du-jour', authenticate, requireRole('medecin'), rendezvousController.agendaDuJour);
router.get('/en-attente', authenticate, requireRole('medecin', 'technicien'), rendezvousController.rdvEnAttente);
router.patch('/:id/statut', authenticate, validate(updateRdvStatutSchema), rendezvousController.updateStatut);

module.exports = router;
