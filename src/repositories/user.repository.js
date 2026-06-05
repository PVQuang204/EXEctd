const User = require('../models/User.model');
const BaseRepository = require('./base.repository');

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  findByEmail(email, selectPassword = false) {
    let q = User.findOne({ email });
    if (selectPassword) q = q.select('+password +refreshToken');
    return q;
  }

  findByRefreshToken(hashedToken) {
    return User.findOne({ refreshToken: hashedToken }).select('+refreshToken');
  }
}

module.exports = new UserRepository();
