const Food = require('../models/Food.model');
const BaseRepository = require('./base.repository');

class FoodRepository extends BaseRepository {
  constructor() {
    super(Food);
  }
}

module.exports = new FoodRepository();
