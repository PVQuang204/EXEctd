const Restaurant = require('../models/Restaurant.model');
const BaseRepository = require('./base.repository');

class RestaurantRepository extends BaseRepository {
  constructor() {
    super(Restaurant);
  }

  findNearby({ lat, lng, distanceMeters = 5000, filter = {} }) {
    return Restaurant.find({
      ...filter,
      status: 'approved',
      location: {
        $near: {
          $geometry: { type: 'Point', coordinates: [lng, lat] },
          $maxDistance: distanceMeters,
        },
      },
    });
  }
}

module.exports = new RestaurantRepository();
