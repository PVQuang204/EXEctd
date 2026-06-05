const Payment = require('../models/Payment.model');
const BaseRepository = require('./base.repository');

class PaymentRepository extends BaseRepository {
  constructor() {
    super(Payment);
  }
}

module.exports = new PaymentRepository();
