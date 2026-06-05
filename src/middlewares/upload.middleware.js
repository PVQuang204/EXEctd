const multer = require('multer');
const path = require('path');
const ApiError = require('../utils/ApiError');

// Cấu hình storage
const createStorage = (folder) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join('uploads', folder));
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    },
  });
};

// Filter chỉ cho phép image
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Only image files (jpg, png, webp) are allowed'), false);
  }
};

// Upload avatar
const uploadAvatar = multer({
  storage: createStorage('avatars'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).single('avatar');

// Upload restaurant thumbnail
const uploadRestaurantThumbnail = multer({
  storage: createStorage('restaurants'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('thumbnail');

// Upload restaurant images (tối đa 5 ảnh)
const uploadRestaurantImages = multer({
  storage: createStorage('restaurants'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array('images', 5);

// Upload food thumbnail
const uploadFoodThumbnail = multer({
  storage: createStorage('foods'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single('thumbnail');

// Upload food images (tối đa 5 ảnh)
const uploadFoodImages = multer({
  storage: createStorage('foods'),
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).array('images', 5);

// Middleware wrapper để xử lý lỗi multer
const handleUpload = (uploadFn) => {
  return (req, res, next) => {
    uploadFn(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return next(new ApiError(400, 'File size cannot exceed 5MB'));
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          return next(new ApiError(400, 'Too many files uploaded'));
        }
        return next(new ApiError(400, err.message));
      }
      if (err) {
        return next(err);
      }
      next();
    });
  };
};

module.exports = {
  uploadAvatar: handleUpload(uploadAvatar),
  uploadRestaurantThumbnail: handleUpload(uploadRestaurantThumbnail),
  uploadRestaurantImages: handleUpload(uploadRestaurantImages),
  uploadFoodThumbnail: handleUpload(uploadFoodThumbnail),
  uploadFoodImages: handleUpload(uploadFoodImages),
};
