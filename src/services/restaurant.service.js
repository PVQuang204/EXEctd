const restaurantRepository = require('../repositories/restaurant.repository');
const { uploadFromBuffer } = require('./upload.service');
const { createNotification } = require('./notification.service');
const { RESTAURANT_STATUSES } = require('../constants');
const ApiError = require('../utils/ApiError');

const createRestaurant = async (ownerId, data, files) => {
  const payload = { ...data, ownerId, status: RESTAURANT_STATUSES.PENDING };
  if (files?.coverImage?.[0]) {
    payload.coverImage = await uploadFromBuffer(files.coverImage[0].buffer, 'restaurants');
  }
  if (files?.logo?.[0]) {
    payload.logo = await uploadFromBuffer(files.logo[0].buffer, 'restaurants');
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
    data.coverImage = await uploadFromBuffer(files.coverImage[0].buffer, 'restaurants');
  }
  if (files?.logo?.[0]) {
    data.logo = await uploadFromBuffer(files.logo[0].buffer, 'restaurants');
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
  return restaurantRepository.findNearby({
    lat: Number(lat),
    lng: Number(lng),
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
