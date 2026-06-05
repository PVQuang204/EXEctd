const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

categorySchema.index({ restaurantId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Category', categorySchema);
