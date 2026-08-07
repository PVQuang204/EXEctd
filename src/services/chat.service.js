const conversationRepository = require('../repositories/conversation.repository');
const messageRepository = require('../repositories/message.repository');
const restaurantRepository = require('../repositories/restaurant.repository');
const userRepository = require('../repositories/user.repository');
const { emitToUser, emitToRestaurant } = require('../sockets');
const ApiError = require('../utils/ApiError');
const { ROLES } = require('../constants');

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
  return messageRepository.listByConversation(conversation._id, {
    before: before ? new Date(before) : null,
    limit: Math.min(Number(limit) || 30, 100),
  });
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

  const senderRole =
    user.role === ROLES.RESTAURANT_OWNER
      ? 'restaurant_owner'
      : user.role === ROLES.ADMIN
      ? 'admin'
      : 'customer';

  const message = await messageRepository.create({
    conversationId: conversation._id,
    senderId: user._id,
    senderRole,
    type: payload.image ? 'image' : 'text',
    text: (payload.text || '').trim().slice(0, 2000),
    image: payload.image || null,
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
  const { isOwner, isCustomer } = await ensureParticipant(user, conversation);
  await messageRepository.markRead(conversation._id, user._id);
  const field = isOwner ? 'ownerUnread' : 'customerUnread';
  await conversationRepository.resetUnread(conversation._id, field);
  return { ok: true };
};

const closeConversation = async (user, conversationId) => {
  const conversation = await conversationRepository.findById(conversationId);
  await ensureParticipant(user, conversation);
  conversation.status = 'closed';
  conversation.closedBy = user._id;
  conversation.closedAt = new Date();
  await conversation.save();
  return conversation;
};

module.exports = {
  openOrGet,
  listMyConversations,
  listMessages,
  sendMessage,
  markRead,
  closeConversation,
};
