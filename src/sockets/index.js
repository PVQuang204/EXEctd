const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/user.repository');
const { getAccessSecret } = require('../config/env');

let io;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || '*',
      methods: ['GET', 'POST'],
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, getAccessSecret());
      const user = await userRepository.findById(decoded.id);
      if (!user || user.status === 'locked') return next(new Error('Unauthorized'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.user._id}`);
    if (socket.user.role === 'restaurant_owner') {
      socket.join(`owner:${socket.user._id}`);
    }
    if (socket.user.role === 'delivery_staff') {
      socket.join('delivery_staff');
    }
    if (socket.user.role === 'admin') {
      socket.join('admin');
    }
    socket.on('join_restaurant', (restaurantId) => {
      socket.join(`restaurant:${restaurantId}`);
    });
    socket.on('disconnect', () => {});
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.io not initialized');
  return io;
};

const emitToUser = (userId, event, data) => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};

const emitToRestaurant = (restaurantId, event, data) => {
  if (io) io.to(`restaurant:${restaurantId}`).emit(event, data);
};

const emitOrderEvent = (order, event) => {
  if (!io) return;
  const payload = { orderId: order._id, status: order.status, order };
  emitToUser(order.customerId.toString(), event, payload);
  emitToRestaurant(order.restaurantId.toString(), event, payload);
  if (order.driverId) {
    emitToUser(order.driverId.toString(), event, payload);
  }
  io.to('delivery_staff').emit(event, payload);
};

module.exports = { initSocket, getIO, emitToUser, emitToRestaurant, emitOrderEvent };
