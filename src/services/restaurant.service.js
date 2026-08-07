const restaurantRepository = require('../repositories/restaurant.repository');
const { uploadFromBuffer, extractUrl } = require('./upload.service');
const { createNotification } = require('./notification.service');
const { RESTAURANT_STATUSES } = require('../constants');
const ApiError = require('../utils/ApiError');

const buildImagePatch = async (uploadResult) => {
  if (!uploadResult) return {};
  const url = extractUrl(uploadResult);
  if (!url) throw new ApiError(500, 'Upload failed');
  return {
    url,
    variants: uploadResult.variants || null,
    blurDataURL: uploadResult.blurDataURL || null,
  };
};

const createRestaurant = async (ownerId, data, files) => {
  const payload = { ...data, ownerId, status: RESTAURANT_STATUSES.APPROVED };
  if (files?.coverImage?.[0]) {
    const result = await uploadFromBuffer(files.coverImage[0].buffer, 'restaurants');
    const patch = await buildImagePatch(result);
    payload.coverImage = patch.url;
    payload.coverImageVariants = patch.variants;
  }
  if (files?.logo?.[0]) {
    const result = await uploadFromBuffer(files.logo[0].buffer, 'restaurants');
    const patch = await buildImagePatch(result);
    payload.logo = patch.url;
    payload.logoVariants = patch.variants;
  }
  return restaurantRepository.create(payload);
};

const updateRestaurant = async (id, ownerId, data, files, isAdmin) => {
  const restaurant = await restaurantRepository.findById(id);
  if (!restaurant) throw new ApiError(404, 'Restaurant not found');
  if (!isAdmin && restaurant.ownerId.toString() !== ownerId.toString()) {
    throw new ApiError(403, 'Not your restaurant');
  }
  if (files?.coverImage?.[0]) {
    const result = await uploadFromBuffer(files.coverImage[0].buffer, 'restaurants');
    const patch = await buildImagePatch(result);
    data.coverImage = patch.url;
    data.coverImageVariants = patch.variants;
  }
  if (files?.logo?.[0]) {
    const result = await uploadFromBuffer(files.logo[0].buffer, 'restaurants');
    const patch = await buildImagePatch(result);
    data.logo = patch.url;
    data.logoVariants = patch.variants;
  }
  return restaurantRepository.updateById(id, data);
};

const updateLocation = async (id, ownerId, { latitude, longitude }) => {
  const restaurant = await restaurantRepository.findById(id);
  if (!restaurant) throw new ApiError(404, 'Restaurant not found');
  if (restaurant.ownerId.toString() !== ownerId.toString()) {
    throw new ApiError(403, 'Not your restaurant');
  }
  return restaurantRepository.updateById(id, {
    latitude,
    longitude,
    locationUpdatedAt: new Date(),
    location: { type: 'Point', coordinates: [longitude, latitude] },
  });
};

const findNearby = ({ lat, lng, distance }) => {
  const distanceMeters = (Number(distance) || 5) * 1000;
  const parsedLat = Number(lat);
  const parsedLng = Number(lng);
  return restaurantRepository.findNearby({
    lat: parsedLat,
    lng: parsedLng,
    distanceMeters,
  });
};

const approveRestaurant = async (id) => {
  const r = await restaurantRepository.updateById(id, { status: RESTAURANT_STATUSES.APPROVED });
  if (!r) throw new ApiError(404, 'Restaurant not found');
  await createNotification({
    userId: r.ownerId,
    title: 'Restaurant approved',
    content: `Your restaurant "${r.name}" has been approved.`,
    type: 'restaurant',
  });
  return r;
};

const rejectRestaurant = async (id) => {
  const r = await restaurantRepository.updateById(id, { status: RESTAURANT_STATUSES.REJECTED });
  if (!r) throw new ApiError(404, 'Restaurant not found');
  return r;
};

const getOwnerRestaurants = (ownerId) =>
  restaurantRepository.find({ ownerId }, { sort: { createdAt: -1 } });

const getById = async (id) => {
  const r = await restaurantRepository.findById(id);
  if (!r) throw new ApiError(404, 'Restaurant not found');
  return r;
};

module.exports = {
  createRestaurant,
  updateRestaurant,
  updateLocation,
  findNearby,
  approveRestaurant,
  rejectRestaurant,
  getOwnerRestaurants,
  getById,
};