const dotenv = require('dotenv');

let loaded = false;

const loadEnv = () => {
  if (loaded) return;
  dotenv.config();
  loaded = true;

  if (!process.env.JWT_ACCESS_SECRET && process.env.JWT_SECRET) {
    process.env.JWT_ACCESS_SECRET = process.env.JWT_SECRET;
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    process.env.JWT_REFRESH_SECRET = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  }
  if (!process.env.MONGODB_URI && process.env.MONGO_URI) {
    process.env.MONGODB_URI = process.env.MONGO_URI;
  }
  if (!process.env.EMAIL_FROM && process.env.FROM_EMAIL) {
    const name = process.env.FROM_NAME || 'Mobile Restaurant';
    process.env.EMAIL_FROM = `${name} <${process.env.FROM_EMAIL}>`;
  }
  if (!process.env.API_URL) {
    process.env.API_URL = `http://localhost:${process.env.PORT || 5000}`;
  }
};

const getAccessSecret = () => {
  loadEnv();
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) {
    throw new Error('JWT_ACCESS_SECRET (or JWT_SECRET) is not defined in .env');
  }
  return secret;
};

const getRefreshSecret = () => {
  loadEnv();
  return process.env.JWT_REFRESH_SECRET || getAccessSecret();
};

const isSmtpConfigured = () => {
  loadEnv();
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return false;
  const placeholders = ['your_', 'your-', 'example.com', 'placeholder'];
  const user = SMTP_USER.toLowerCase();
  return !placeholders.some((p) => user.includes(p));
};

const isCloudinaryConfigured = () => {
  loadEnv();
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

module.exports = {
  loadEnv,
  getAccessSecret,
  getRefreshSecret,
  isSmtpConfigured,
  isCloudinaryConfigured,
};
