const Review = require('../models/Review.model');
const BaseRepository = require('./base.repository');

class ReviewRepository extends BaseRepository {
  constructor() {
    super(Review);
  }
}

module.exports = new ReviewRepository();
