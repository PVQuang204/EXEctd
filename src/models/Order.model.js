const mongoose = require('mongoose');
const { ORDER_STATUSES, PAYMENT_STATUSES } = require('../constants');

const ORDER_TRACKING_STEPS = [
  { key: 'placed', label: 'Đã đặt', emoji: '📝' },
  { key: 'confirmed', label: 'Nhà hàng xác nhận', emoji: '✅' },
  { key: 'preparing', label: 'Đang chuẩn bị', emoji: '👨‍🍳' },
  { key: 'ready', label: 'Sẵn sàng giao', emoji: '📦' },
  { key: 'out_for_delivery', label: 'Đang giao', emoji: '🛵' },
  { key: 'completed', label: 'Hoàn tất', emoji: '🎉' },
  { key: 'cancelled', label: 'Đã hủy', emoji: '❌' },
];

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

const trackingStepSchema = new mongoose.Schema(
  {
    step: { type: String, required: true },
    label: { type: String, required: true },
    emoji: { type: String, default: '•' },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    estimatedAt: { type: Date },
    note: { type: String },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderCode: { type: String },
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
    paymentMethod: { type: String, enum: ['cod', 'payos'], default: null },
    paymentStatus: {
      type: String,
      enum: Object.values(PAYMENT_STATUSES),
      default: PAYMENT_STATUSES.UNPAID,
    },
    promotionCode: { type: String },
    statusHistory: [statusHistorySchema],
    cancelReason: { type: String },
    tracking: { type: [trackingStepSchema], default: [] },
    estimatedDelivery: { type: Date },
    riderInfo: {
      name: { type: String, default: null },
      phone: { type: String, default: null },
      location: {
        type: { type: String, enum: ['Point'], default: 'Point' },
        coordinates: { type: [Number] },
      },
    },
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ restaurantId: 1, status: 1 });
orderSchema.index({ orderCode: 1 }, { unique: true });

orderSchema.methods.buildTrackingForStatus = function (newStatus) {
  const stepDef = ORDER_TRACKING_STEPS.find((s) => s.key === this._mapStatusToTracking(newStatus));
  if (!stepDef) return this.tracking;

  const existing = this.tracking.find((t) => t.step === stepDef.key);
  if (existing) {
    existing.completedAt = new Date();
    existing.estimatedAt = existing.estimatedAt || this._estimateForStep(stepDef.key);
  } else {
    this.tracking.push({
      step: stepDef.key,
      label: stepDef.label,
      emoji: stepDef.emoji,
      startedAt: new Date(),
      completedAt: new Date(),
      estimatedAt: this._estimateForStep(stepDef.key),
    });
  }

  for (const step of ORDER_TRACKING_STEPS) {
    const inTracking = this.tracking.find((t) => t.step === step.key);
    if (inTracking && !inTracking.completedAt) {
      inTracking.completedAt = new Date();
    }
  }
  return this.tracking;
};

orderSchema.methods._mapStatusToTracking = function (status) {
  const map = {
    pending: 'placed',
    confirmed: 'confirmed',
    preparing: 'preparing',
    ready: 'ready',
    completed: 'completed',
    cancelled: 'cancelled',
  };
  return map[status] || status;
};

orderSchema.methods._estimateForStep = function (stepKey) {
  const base = new Date();
  const minutes = {
    placed: 0,
    confirmed: 2,
    preparing: 15,
    ready: 25,
    out_for_delivery: 30,
    completed: 45,
    cancelled: 0,
  };
  return new Date(base.getTime() + (minutes[stepKey] || 0) * 60000);
};

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
module.exports.ORDER_TRACKING_STEPS = ORDER_TRACKING_STEPS;
