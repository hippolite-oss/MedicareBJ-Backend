/**
 * tests/unit/paiement.test.js
 */
const { formatTelephoneFedaPay, mapStatutFedaPay } = require('../../src/utils/fedapay');

describe('Paiement / FedaPay', () => {
  describe('formatTelephoneFedaPay', () => {
    it('formate un numéro béninois', () => {
      expect(formatTelephoneFedaPay('+22997123456')).toEqual({ number: '97123456', country: 'bj' });
    });
  });

  describe('mapStatutFedaPay', () => {
    it('mappe les statuts FedaPay', () => {
      expect(mapStatutFedaPay('approved')).toBe('complete');
      expect(mapStatutFedaPay('declined')).toBe('echoue');
      expect(mapStatutFedaPay('pending')).toBe('en_attente');
    });
  });
});
