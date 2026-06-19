const Counter = require('../models/Counter.model');

class CounterRepository {
  async getNextSequence(name) {
    return Counter.getNextSequence(name);
  }
}

module.exports = new CounterRepository();
