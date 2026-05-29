/**
 * routes/index.js — Agrégateur de toutes les routes
 */
const router = require('express').Router();

router.use('/auth', require('./auth.routes'));
router.use('/utilisateurs', require('./utilisateur.routes'));
router.use('/dossiers', require('./dossier.routes'));
router.use('/qrcodes', require('./qrcode.routes'));
router.use('/acces', require('./acces.routes'));
router.use('/consultations', require('./consultation.routes'));
router.use('/prescriptions', require('./prescription.routes'));
router.use('/medicaments', require('./medicament.routes'));
router.use('/analyses', require('./analyse.routes'));
router.use('/rendezvous', require('./rendezvous.routes'));
router.use('/agenda', require('./agenda.routes'));
router.use('/paiements', require('./paiement.routes'));
router.use('/messages', require('./message.routes'));
router.use('/notifications', require('./notification.routes'));
router.use('/signalements', require('./signalement.routes'));
router.use('/hopitaux', require('./hopital.routes'));
router.use('/admin', require('./admin.routes'));
router.use('/audit', require('./audit.routes'));
router.use('/uploads', require('./upload.routes'));

module.exports = router;
