/**
 * tests/unit/paiement.test.js
 */
const crypto = require('crypto');

process.env.CINETPAY_SECRET_KEY = 'test_cinetpay_secret';
process.env.MTN_API_KEY = 'test_mtn_key';

const { paiementService } = require('../../src/services/paiement.service');

describe('Paiement Service', () => {
  describe('verifierSignatureCinetPay', () => {
    it('doit valider une signature HMAC correcte', () => {
      const payload = { transaction_id: 'test-123', status: 'ACCEPTED', amount: 5000 };
      const signature = crypto.createHmac('sha256', process.env.CINETPAY_SECRET_KEY).update(JSON.stringify(payload)).digest('hex');
      expect(paiementService.verifierSignatureCinetPay(payload, signature)).toBe(true);
    });

    it('doit rejeter une signature HMAC incorrecte', () => {
      const payload = { transaction_id: 'test-123', status: 'ACCEPTED' };
      expect(paiementService.verifierSignatureCinetPay(payload, 'signature_invalide')).toBe(false);
    });
  });

  describe('verifierSignatureMTN', () => {
    it('doit valider une signature MTN correcte', () => {
      const payload = { externalId: 'test-456', status: 'SUCCESSFUL' };
      const signature = crypto.createHmac('sha256', process.env.MTN_API_KEY).update(JSON.stringify(payload)).digest('hex');
      expect(paiementService.verifierSignatureMTN(payload, signature)).toBe(true);
    });

    it('doit rejeter une signature MTN incorrecte', () => {
      const payload = { externalId: 'test-456', status: 'SUCCESSFUL' };
      expect(paiementService.verifierSignatureMTN(payload, 'mauvaise_signature')).toBe(false);
    });
  });
});
