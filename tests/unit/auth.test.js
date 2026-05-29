/**
 * tests/unit/auth.test.js
 */
const { hashPassword, comparePassword } = require('../../src/utils/hashPassword');
const { generateAccessToken, generateRefreshToken, verifyAccessToken, generateResetToken, hashResetToken } = require('../../src/utils/generateToken');

// Mock env
process.env.JWT_SECRET = 'test_secret_key_minimum_64_characters_for_testing_purposes_only';
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret_key_minimum_64_characters_for_testing_only';
process.env.JWT_EXPIRES_IN = '15m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

describe('hashPassword', () => {
  it('doit hasher un mot de passe', async () => {
    const hash = await hashPassword('MonMotDePasse123!');
    expect(hash).toBeDefined();
    expect(hash).not.toBe('MonMotDePasse123!');
    expect(hash.startsWith('$2b$')).toBe(true);
  });

  it('doit vérifier un mot de passe correct', async () => {
    const hash = await hashPassword('MonMotDePasse123!');
    const valid = await comparePassword('MonMotDePasse123!', hash);
    expect(valid).toBe(true);
  });

  it('doit rejeter un mot de passe incorrect', async () => {
    const hash = await hashPassword('MonMotDePasse123!');
    const valid = await comparePassword('MauvaisMotDePasse', hash);
    expect(valid).toBe(false);
  });
});

describe('generateToken', () => {
  const mockUser = { id: 'uuid-test-123', email: 'test@test.com', role: 'patient', statut: 'actif' };

  it('doit générer un access token valide', () => {
    const token = generateAccessToken(mockUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('doit contenir le bon payload dans l\'access token', () => {
    const token = generateAccessToken(mockUser);
    const decoded = verifyAccessToken(token);
    expect(decoded.id).toBe(mockUser.id);
    expect(decoded.email).toBe(mockUser.email);
    expect(decoded.role).toBe(mockUser.role);
  });

  it('doit générer un refresh token', () => {
    const token = generateRefreshToken(mockUser);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('doit rejeter un token invalide', () => {
    expect(() => verifyAccessToken('token.invalide.ici')).toThrow();
  });

  it('doit générer un token de reset avec hash et expiration', () => {
    const { token, hash, expires } = generateResetToken();
    expect(token).toBeDefined();
    expect(hash).toBeDefined();
    expect(expires).toBeInstanceOf(Date);
    expect(expires > new Date()).toBe(true);
    // Vérifier que le hash correspond
    expect(hashResetToken(token)).toBe(hash);
  });
});
