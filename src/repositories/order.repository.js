const Order = require('../models/Order.model');
const BaseRepository = require('./base.repository');

class OrderRepository extends BaseRepository {
  constructor() {
    super(Order);
  }
}

module.exports = new OrderRepository();
