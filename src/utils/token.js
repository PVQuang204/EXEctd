const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { getAccessSecret, getRefreshSecret } = require('../config/env');

const generateAccessToken = (userId) =>
  jwt.sign({ id: userId }, getAccessSecret(), {
    expiresIn: process.env.JWT_ACCESS_EXPIRE || '15m',
  });

const generateRefreshToken = (userId) =>
  jwt.sign({ id: userId }, getRefreshSecret(), {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d',
  });

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const verifyAccessToken = (token) => jwt.verify(token, getAccessSecret());

const verifyRefreshToken = (token) => jwt.verify(token, getRefreshSecret());

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  verifyAccessToken,
  verifyRefreshToken,
};
