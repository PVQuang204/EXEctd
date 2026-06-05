const nodemailer = require('nodemailer');
const ApiError = require('./ApiError');
const { isSmtpConfigured, loadEnv } = require('../config/env');

const sendEmail = async ({ to, subject, html }) => {
  loadEnv();

  if (!isSmtpConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      throw new ApiError(500, 'Email service is not configured');
    }
    console.info(`[Email:dev] To: ${to} | Subject: ${subject}`);
    console.info(`[Email:dev] Preview: ${html.replace(/<[^>]+>/g, ' ').slice(0, 200)}...`);
    return { devMode: true, to, subject };
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    html,
  });

  return { sent: true };
};

module.exports = sendEmail;
