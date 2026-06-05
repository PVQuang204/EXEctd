const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
    foodIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Food' }],
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 1000 },
    images: { type: [String], default: [] },
  },
  { timestamps: true }
);

reviewSchema.index({ customerId: 1, restaurantId: 1, orderId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Review', reviewSchema);
