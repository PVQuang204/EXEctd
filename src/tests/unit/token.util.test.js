const {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyAccessToken,
} = require('../../utils/token');

describe('Token utils', () => {
  it('generates and verifies access token', () => {
    const token = generateAccessToken('507f1f77bcf86cd799439011');
    const decoded = verifyAccessToken(token);
    expect(decoded.id).toBe('507f1f77bcf86cd799439011');
  });

  it('hashes token consistently', () => {
    const a = hashToken('abc');
    const b = hashToken('abc');
    expect(a).toBe(b);
    expect(a).not.toBe('abc');
  });

  it('generates refresh token', () => {
    const token = generateRefreshToken('507f1f77bcf86cd799439011');
    expect(typeof token).toBe('string');
  });
});
