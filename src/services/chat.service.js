const conversationRepository = require('../repositories/conversation.repository');
const messageRepository = require('../repositories/message.repository');
const restaurantRepository = require('../repositories/restaurant.repository');
const userRepository = require('../repositories/user.repository');
const { emitToUser, emitToRestaurant } = require('../sockets');
const ApiError = require('../utils/ApiError');
const { ROLES, CHAT_EVENTS } = require('../constants');

// Allowed hosts for image URLs in chat messages
const CHAT_IMAGE_ALLOWED_HOSTS = [
  'res.cloudinary.com',
  'cloudinary.com',
  ...(process.env.CHAT_IMAGE_ALLOWED_HOSTS
    ? process.env.CHAT_IMAGE_ALLOWED_HOSTS.split(',').map((h) => h.trim().toLowerCase())
    : []),
];

const isValidHttpUrl = (value) => {
  if (typeof value !== 'string' || value.length === 0 || value.length > 2048) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

const isAllowedImageUrl = (url) => {
  if (!isValidHttpUrl(url)) return false;
  try {
    const { hostname } = new URL(url);
    return CHAT_IMAGE_ALLOWED_HOSTS.includes(hostname.toLowerCase());
  } catch {
    return false;
  }
};

const ensureParticipant = async (user, conversation) => {
  if (!conversation) throw new ApiError(404, 'Conversation not found');
  const uid = user._id.toString();
  const isCustomer = conversation.customerId.toString() === uid;
  const isOwner = conversation.ownerId.toString() === uid;
  const isAdmin = user.role === ROLES.ADMIN;
  if (!isCustomer && !isOwner && !isAdmin) {
    throw new ApiError(403, 'You are not a participant of this conversation');
  }
  return { isCustomer, isOwner, isAdmin };
};

const openOrGet = async (user, restaurantId) => {
  const restaurant = await restaurantRepository.findById(restaurantId);
  if (!restaurant || restaurant.status !== 'approved') {
    throw new ApiError(400, 'Restaurant not available');
  }
  if (user.role !== ROLES.CUSTOMER) {
    throw new ApiError(403, 'Only customers can open support chat');
  }
  return conversationRepository.findOrCreate({
    restaurantId,
    customerId: user._id,
    ownerId: restaurant.ownerId,
  });
};

const listMyConversations = async (user) => {
  const filter =
    user.role === ROLES.CUSTOMER
      ? { customerId: user._id }
      : user.role === ROLES.RESTAURANT_OWNER
      ? { ownerId: user._id }
      : {};
  return conversationRepository.find(filter, {
    sort: { lastMessageAt: -1 },
    populate: [
      { path: 'customerId', select: 'fullName avatar' },
      { path: 'ownerId', select: 'fullName avatar' },
      { path: 'restaurantId', select: 'name' },
    ],
  });
};

const listMessages = async (user, conversationId, { before, limit = 30 } = {}) => {
  const conversation = await conversationRepository.findById(conversationId);
  await ensureParticipant(user, conversation);
  return messageRepository.listByConversation(conversation._id, user._id, {
    before: before ? new Date(before) : null,
    limit: Math.min(Number(limit) || 30, 100),
  });
};

const deleteMessage = async (user, conversationId, messageId) => {
  const conversation = await conversationRepository.findById(conversationId);
  await ensureParticipant(user, conversation);

  const message = await messageRepository.findById(messageId);
  if (!message) throw new ApiError(404, 'Message not found');
  if (message.conversationId.toString() !== conversation._id.toString()) {
    throw new ApiError(400, 'Message does not belong to this conversation');
  }

  const isSender = message.senderId.toString() === user._id.toString();
  const isAdmin = user.role === ROLES.ADMIN;
  if (!isSender && !isAdmin) {
    throw new ApiError(403, 'You can only delete your own messages');
  }

  return messageRepository.softDeleteForUser(message._id, user._id);
};

const sendMessage = async (user, conversationId, payload) => {
  const conversation = await conversationRepository.findById(conversationId);
  if (!conversation) throw new ApiError(404, 'Conversation not found');
  if (conversation.status === 'closed') {
    throw new ApiError(400, 'Conversation is closed');
  }
  const { isOwner, isCustomer } = await ensureParticipant(user, conversation);

  if (!payload.text && !payload.image) {
    throw new ApiError(400, 'Message must contain text or image');
  }

  // Validate image URL if provided
  let safeImage = null;
  if (payload.image) {
    if (!isAllowedImageUrl(payload.image)) {
      throw new ApiError(
        400,
        'Image URL must be https/http from an allowed host (e.g. Cloudinary)'
      );
    }
    safeImage = payload.image;
  }

  const senderRole =
    user.role === ROLES.RESTAURANT_OWNER
      ? 'restaurant_owner'
      : user.role === ROLES.ADMIN
      ? 'admin'
      : 'customer';

  const rawText = (payload.text || '').trim();
  const TEXT_MAX = 2000;
  const truncated = rawText.length > TEXT_MAX;
  const cleanText = truncated ? rawText.slice(0, TEXT_MAX) : rawText;

  if (truncated) {
    // Log so operators can detect clients sending too-large payloads
    console.warn(
      `[chat] text truncated from ${rawText.length} to ${TEXT_MAX} chars (conversation=${conversation._id}, sender=${user._id})`
    );
  }

  const message = await messageRepository.create({
    conversationId: conversation._id,
    senderId: user._id,
    senderRole,
    type: safeImage ? 'image' : 'text',
    text: cleanText,
    image: safeImage,
    metadata: payload.metadata,
  });

  const sender = await userRepository.findById(user._id);
  const unreadField = isOwner ? 'customerUnread' : 'ownerUnread';
  await conversationRepository.updateById(conversation._id, {
    lastMessageAt: new Date(),
    lastMessageText: payload.text ? payload.text.slice(0, 120) : '[image]',
  });
  await conversationRepository.incrementUnread(conversation._id, unreadField);

  const recipientId = isOwner ? conversation.customerId : conversation.ownerId;
  emitToUser(recipientId.toString(), 'chat:message', {
    conversationId: conversation._id,
    message,
  });
  emitToUser(recipientId.toString(), 'chat:conversation_updated', {
    conversationId: conversation._id,
    snippet: message.text || '[image]',
    from: sender?.fullName || 'Unknown',
    role: senderRole,
  });
  emitToRestaurant(conversation.restaurantId.toString(), 'chat:message', {
    conversationId: conversation._id,
    message,
  });

  return message;
};

const markRead = async (user, conversationId) => {
  const conversation = await conversationRepository.findById(conversationId);
  const { isOwner } = await ensureParticipant(user, conversation);
  await messageRepository.markRead(conversation._id, user._id);
  const field = isOwner ? 'ownerUnread' : 'customerUnread';
  await conversationRepository.resetUnread(conversation._id, field);

  // Notify the other participant that messages were read
  const recipientId = isOwner ? conversation.customerId : conversation.ownerId;
  emitToUser(recipientId.toString(), 'chat:read', {
    conversationId: conversation._id,
    readerId: user._id,
    readerRole: user.role,
    readAt: new Date(),
  });

  return { ok: true };
};

const closeConversation = async (user, conversationId) => {
  const conversation = await conversationRepository.findById(conversationId);
  if (!conversation) throw new ApiError(404, 'Conversation not found');
  if (conversation.status === 'closed') {
    throw new ApiError(400, 'Conversation already closed');
  }
  await ensureParticipant(user, conversation);
  conversation.status = 'closed';
  conversation.closedBy = user._id;
  conversation.closedAt = new Date();
  await conversation.save();

  // Notify both participants that the conversation is closed
  const recipientId =
    conversation.customerId.toString() === user._id.toString()
      ? conversation.ownerId
      : conversation.customerId;
  emitToUser(recipientId.toString(), 'chat:closed', {
    conversationId: conversation._id,
    closedBy: user._id,
    closedAt: conversation.closedAt,
  });
  emitToUser(user._id.toString(), 'chat:closed', {
    conversationId: conversation._id,
    closedBy: user._id,
    closedAt: conversation.closedAt,
  });

  return conversation;
};

module.exports = {
  openOrGet,
  listMyConversations,
  listMessages,
  sendMessage,
  markRead,
  closeConversation,
  deleteMessage,
};
