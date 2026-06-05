const Notification = require('../models/Notification.model');
const BaseRepository = require('./base.repository');

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }
}

module.exports = new NotificationRepository();
