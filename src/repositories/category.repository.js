const Category = require('../models/Category.model');
const BaseRepository = require('./base.repository');

class CategoryRepository extends BaseRepository {
  constructor() {
    super(Category);
  }
}

module.exports = new CategoryRepository();
