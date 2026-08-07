const Conversation = require('../models/Conversation.model');
const BaseRepository = require('./base.repository');

class ConversationRepository extends BaseRepository {
  constructor() {
    super(Conversation);
  }

  findOrCreate({ restaurantId, customerId, ownerId }) {
    return Conversation.findOneAndUpdate(
      { restaurantId, customerId },
      {
        $setOnInsert: {
          restaurantId,
          customerId,
          ownerId,
          status: 'open',
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  }

  incrementUnread(conversationId, field) {
    return Conversation.findByIdAndUpdate(
      conversationId,
      { $inc: { [field]: 1 }, $set: { lastMessageAt: new Date() } },
      { new: true }
    );
  }

  resetUnread(conversationId, field) {
    return Conversation.findByIdAndUpdate(
      conversationId,
      { $set: { [field]: 0 } },
      { new: true }
    );
  }
}

module.exports = new ConversationRepository();
