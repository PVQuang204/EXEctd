const Combo = require('../models/Combo.model');
const BaseRepository = require('./base.repository');

class ComboRepository extends BaseRepository {
  constructor() {
    super(Combo);
  }
}

module.exports = new ComboRepository();
