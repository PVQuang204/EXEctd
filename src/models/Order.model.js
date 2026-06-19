const mongoose = require('mongoose');
const { ORDER_STATUSES, PAYMENT_STATUSES } = require('../constants');

const orderItemSchema = new mongoose.Schema(
  {
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
    comboId: { type: mongoose.Schema.Types.ObjectId, ref: 'Combo' },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    subtotal: { type: Number, required: true },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: Object.values(ORDER_STATUSES), required: true },
    note: { type: String },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String, unique: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0 },
    depositAmount: { type: Number, default: 0 },
    remainingAmount: { type: Number, default: 0 },
    paymentPhase: { type: String, enum: ['deposit', 'full', 'none'], default: 'none' },
    deliveryAddress: { type: String, required: true },
    deliveryName: { type: String, required: true },
    deliveryPhone: { type: String, required: true },
    deliveryTime: { type: Date },
    deliveryLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] },
    },
    note: { type: String, maxlength: 500 },
    status: { type: String, enum: Object.values(ORDER_STATUSES), default: ORDER_STATUSES.PENDING },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.UNPAID,
    },
    promotionCode: { type: String },
    statusHistory: [statusHistorySchema],
    cancelReason: { type: String },
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ orderCode: 1 }, { unique: true });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
