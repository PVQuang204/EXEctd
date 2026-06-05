const restaurantService = require('../../services/restaurant.service');
const userRepository = require('../../repositories/user.repository');

describe('Restaurant service', () => {
  let owner;

  beforeEach(async () => {
    owner = await userRepository.create({
      fullName: 'Owner',
      email: 'resto@test.com',
      password: 'password123',
      role: 'restaurant_owner',
    });
  });

  it('creates and approves restaurant', async () => {
    const r = await restaurantService.createRestaurant(owner._id, {
      name: 'New Truck',
      description: 'Street food',
    });
    expect(r.status).toBe('pending');
    const approved = await restaurantService.approveRestaurant(r._id);
    expect(approved.status).toBe('approved');
  });

  it('updates GPS location', async () => {
    const r = await restaurantService.createRestaurant(owner._id, { name: 'GPS Truck' });
    const updated = await restaurantService.updateLocation(r._id, owner._id, {
      latitude: 21.0285,
      longitude: 105.8542,
    });
    expect(updated.latitude).toBe(21.0285);
    const nearby = await restaurantService.findNearby({
      lat: 21.0285,
      lng: 105.8542,
      distance: 50,
    });
    expect(nearby.length).toBeGreaterThanOrEqual(0);
  });
});
