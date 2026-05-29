/**
 * routes/audit.routes.js
 */
const router = require('express').Router();
const { auditController } = require('../controllers/audit.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { requireRole } = require('../middlewares/role.middleware');

router.get('/', authenticate, requireRole('admin'), auditController.list);
router.get('/export', authenticate, requireRole('admin'), auditController.export);

module.exports = router;
