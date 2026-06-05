const { v2: cloudinary } = require('cloudinary');

const configureCloudinary = () => {
  const { isCloudinaryConfigured } = require('./env');
  if (!isCloudinaryConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Cloudinary not configured — set CLOUDINARY_* for production uploads');
    }
    return;
  }
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
};

module.exports = { cloudinary, configureCloudinary };
