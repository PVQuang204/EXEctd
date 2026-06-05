const Promotion = require('../models/Promotion.model');
const BaseRepository = require('./base.repository');

class PromotionRepository extends BaseRepository {
  constructor() {
    super(Promotion);
  }
}

module.exports = new PromotionRepository();
