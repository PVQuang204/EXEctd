const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: null },
    stock: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

foodSchema.index({ restaurantId: 1, categoryId: 1 });

module.exports = mongoose.model('Food', foodSchema);
