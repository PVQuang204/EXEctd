const mongoose = require('mongoose');

const MESSAGE_TYPES = ['text', 'image', 'system'];

const messageSchema = new mongoose.Schema(
  {
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['customer', 'restaurant_owner', 'admin', 'system'], required: true },
    type: { type: String, enum: MESSAGE_TYPES, default: 'text' },
    text: { type: String, maxlength: 2000, default: '' },
    image: { type: String, default: null },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
    metadata: { type: mongoose.Schema.Types.Mixed },
    deletedFor: { type: [mongoose.Schema.Types.ObjectId], default: [] },
  },
  { timestamps: true }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
module.exports.MESSAGE_TYPES = MESSAGE_TYPES;
