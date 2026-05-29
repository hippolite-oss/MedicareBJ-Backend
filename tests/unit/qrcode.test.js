/**
 * tests/unit/qrcode.test.js
 */
process.env.QR_SECRET = 'test_qr_secret_key_minimum_32_characters_here';

const jwt = require('jsonwebtoken');

describe('QR Code Service', () => {
  const mockPayload = { id_dossier: 'dossier-uuid', id_patient: 'patient-uuid', type_acces: 'lecture' };

  it('doit générer un token QR JWT valide', () => {
    const token = jwt.sign(mockPayload, process.env.QR_SECRET, { expiresIn: '24h' });
    expect(token).toBeDefined();
    const decoded = jwt.verify(token, process.env.QR_SECRET);
    expect(decoded.id_dossier).toBe(mockPayload.id_dossier);
    expect(decoded.type_acces).toBe('lecture');
  });

  it('doit rejeter un token QR expiré', () => {
    const token = jwt.sign(mockPayload, process.env.QR_SECRET, { expiresIn: '0s' });
    expect(() => jwt.verify(token, process.env.QR_SECRET)).toThrow('jwt expired');
  });

  it('doit rejeter un token QR avec mauvaise clé', () => {
    const token = jwt.sign(mockPayload, 'mauvaise_cle_secrete');
    expect(() => jwt.verify(token, process.env.QR_SECRET)).toThrow();
  });

  it('doit contenir le bon type_acces dans le payload', () => {
    const tokenEcriture = jwt.sign({ ...mockPayload, type_acces: 'ecriture' }, process.env.QR_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(tokenEcriture, process.env.QR_SECRET);
    expect(decoded.type_acces).toBe('ecriture');
  });
});
