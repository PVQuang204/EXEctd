const Restaurant = require('../models/Restaurant.model');
const BaseRepository = require('./base.repository');

class RestaurantRepository extends BaseRepository {
  constructor() {
    super(Restaurant);
  }

  findNearby({ lat, lng, distance, filter = {} }) {
    const query = { ...filter, status: 'approved' };
    const hasGeo = Number.isFinite(lat) && Number.isFinite(lng);
    if (hasGeo) {
      const distanceMeters = (Number(distance) || 5) * 1000;
      return Restaurant.find({
        ...query,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: distanceMeters,
          },
        },
      });
    }
    return Restaurant.find(query).sort({ createdAt: -1 });
  }
}

module.exports = new RestaurantRepository();
