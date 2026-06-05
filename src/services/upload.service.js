const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { cloudinary } = require('../config/cloudinary');
const { isCloudinaryConfigured, loadEnv } = require('../config/env');
const ApiError = require('../utils/ApiError');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (error, result) => {
        if (error) reject(new ApiError(500, error.message));
        else resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });

const uploadToLocal = (buffer, folder) => {
  const dir = path.join(UPLOAD_ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });
  const filename = `${crypto.randomUUID()}.jpg`;
  fs.writeFileSync(path.join(dir, filename), buffer);
  loadEnv();
  const base = (process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`).replace(
    /\/$/,
    ''
  );
  return `${base}/uploads/${folder}/${filename}`;
};

const uploadFromBuffer = async (buffer, folder = 'mobile-restaurant') => {
  if (!buffer?.length) throw new ApiError(400, 'Empty file');

  if (isCloudinaryConfigured()) {
    return uploadToCloudinary(buffer, folder);
  }

  if (process.env.NODE_ENV === 'production') {
    throw new ApiError(
      500,
      'Cloudinary is required in production. Set CLOUDINARY_* environment variables.'
    );
  }

  return uploadToLocal(buffer, folder);
};

module.exports = { uploadFromBuffer, UPLOAD_ROOT };
