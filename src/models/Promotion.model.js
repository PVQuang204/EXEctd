const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    discountType: { type: String, enum: ['percent', 'fixed'], required: true },
    discountValue: { type: Number, required: true, min: 0 },
    minOrderAmount: { type: Number, default: 0 },
    code: { type: String, trim: true, uppercase: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

promotionSchema.index({ restaurantId: 1, code: 1 }, { sparse: true });

module.exports = mongoose.model('Promotion', promotionSchema);
