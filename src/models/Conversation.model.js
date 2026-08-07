const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    lastMessageAt: { type: Date, default: Date.now, index: true },
    lastMessageText: { type: String, default: '', maxlength: 500 },
    customerUnread: { type: Number, default: 0 },
    ownerUnread: { type: Number, default: 0 },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

conversationSchema.index({ restaurantId: 1, customerId: 1 }, { unique: true });
conversationSchema.index({ customerId: 1, lastMessageAt: -1 });
conversationSchema.index({ ownerId: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
