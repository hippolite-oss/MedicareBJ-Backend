/**
 * routes/auth.routes.js
 */
const router = require('express').Router();
const { authController } = require('../controllers/auth.controller');
const { validate } = require('../middlewares/validate.middleware');
const { authenticate } = require('../middlewares/auth.middleware');
const { authRateLimit } = require('../middlewares/rateLimit.middleware');
const { registerSchema, registerProSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, refreshSchema } = require('../validations/auth.validation');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentification et gestion des comptes
 */

router.post('/register', validate(registerSchema), authController.register);
router.post('/register/pro', validate(registerProSchema), authController.registerPro);
router.post('/login', authRateLimit, validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.post('/logout', authenticate, authController.logout);
router.post('/forgot-password', authRateLimit, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', authenticate, authController.me);

module.exports = router;
