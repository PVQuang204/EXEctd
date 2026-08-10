const Message = require('../models/Message.model');
const BaseRepository = require('./base.repository');

class MessageRepository extends BaseRepository {
  constructor() {
    super(Message);
  }

  listByConversation(conversationId, viewerId, { skip = 0, limit = 30, before } = {}) {
    const filter = {
      conversationId,
      deletedFor: { $ne: viewerId },
    };
    if (before) filter.createdAt = { $lt: before };
    return Message.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'fullName avatar role');
  }

  markRead(conversationId, readerId) {
    return Message.updateMany(
      { conversationId, senderId: { $ne: readerId }, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );
  }

  softDeleteForUser(messageId, userId) {
    return Message.findByIdAndUpdate(
      messageId,
      { $addToSet: { deletedFor: userId } },
      { new: true }
    );
  }
}

module.exports = new MessageRepository();
