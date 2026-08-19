const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { cloudinary } = require('../config/cloudinary');
const { isCloudinaryConfigured, loadEnv } = require('../config/env');
const { processFoodImage, VARIANT_NAMES } = require('./imageProcessor.service');
const ApiError = require('../utils/ApiError');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');

const buildCloudinaryVariants = (publicId) => {
  const base = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
  const urls = {};
  for (const v of VARIANT_NAMES) {
    urls[v] = `${base}/f_webp,q_auto,w_auto,c_fill,g_auto/${publicId}`;
  }
  return urls;
};

const uploadToCloudinary = (buffer, folder) =>
  new Promise((resolve, reject) => {
    const publicId = `${folder}/${crypto.randomUUID()}`;
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId.split('/').pop(),
        resource_type: 'image',
        eager: [
          { width: 96, height: 96, crop: 'fill', format: 'webp', quality: 'auto:low' },
          { width: 320, height: 240, crop: 'fill', format: 'webp', quality: 'auto:eco' },
          { width: 720, crop: 'scale', format: 'webp', quality: 'auto:good' },
          { width: 1280, crop: 'scale', format: 'webp', quality: 'auto:best' },
        ],
        eager_async: false,
      },
      (error, result) => {
        if (error) {
          return reject(new ApiError(500, error.message));
        }
        const cloudId = result.public_id;
        const variants = {
          thumb: result.eager?.[0]?.secure_url || result.secure_url,
          card: result.eager?.[1]?.secure_url || result.secure_url,
          detail: result.eager?.[2]?.secure_url || result.secure_url,
          original: result.eager?.[3]?.secure_url || result.secure_url,
        };
        resolve({
          url: result.secure_url,
          publicId: cloudId,
          variants,
          meta: {
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          },
        });
      }
    );
    stream.end(buffer);
  });

const uploadToLocal = async (buffer, folder) => {
  const { meta, blurDataURL, variants } = await processFoodImage(buffer);
  const dir = path.join(UPLOAD_ROOT, folder);
  fs.mkdirSync(dir, { recursive: true });
  const id = crypto.randomUUID();

  const urls = {};
  for (const name of VARIANT_NAMES) {
    const filename = `${id}_${name}.webp`;
    fs.writeFileSync(path.join(dir, filename), variants[name]);
    urls[name] = filename;
  }

  loadEnv();
  const base = (process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`).replace(
    /\/+$/,
    ''
  );
  const absUrls = Object.fromEntries(
    Object.entries(urls).map(([k, v]) => [k, `${base}/uploads/${folder}/${v}`])
  );

  return {
    url: absUrls.original,
    publicId: id,
    variants: absUrls,
    meta,
    blurDataURL,
  };
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

const uploadFoodImage = async (buffer, restaurantId) =>
  uploadFromBuffer(buffer, `foods/${restaurantId}`);

const extractUrl = (uploadResult) => {
  if (!uploadResult) return null;
  if (typeof uploadResult === 'string') return uploadResult;
  if (typeof uploadResult === 'object' && uploadResult.url) return uploadResult.url;
  return null;
};

const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image', invalidate: true });
  } catch (err) {
    console.error('[upload.service] Cloudinary delete failed:', err.message);
  }
};

const deleteFromLocal = async (url) => {
  if (!url) return;
  try {
    const prefix = '/uploads/';
    const idx = url.indexOf(prefix);
    if (idx === -1) return;
    const relative = url.substring(idx + prefix.length);
    const filePath = path.join(UPLOAD_ROOT, relative);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  } catch (err) {
    console.error('[upload.service] Local delete failed:', err.message);
  }
};

const deleteRemoteFile = async (url) => {
  if (!url || typeof url !== 'string') return;
  if (isCloudinaryConfigured() && url.includes('res.cloudinary.com')) {
    const marker = '/image/upload/';
    const i = url.indexOf(marker);
    if (i === -1) return;
    const tail = url.substring(i + marker.length).split('?')[0];
    const publicId = tail.replace(/\.[^.]+$/, '');
    await deleteFromCloudinary(publicId);
    return;
  }
  await deleteFromLocal(url);
};

module.exports = {
  uploadFromBuffer,
  uploadFoodImage,
  extractUrl,
  deleteRemoteFile,
  UPLOAD_ROOT,
  buildCloudinaryVariants,
};
