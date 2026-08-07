const mongoose = require('mongoose');

const imageVariantsSchema = new mongoose.Schema(
  {
    thumb: { type: String, default: null },
    card: { type: String, default: null },
    detail: { type: String, default: null },
    original: { type: String, default: null },
  },
  { _id: false }
);

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, default: null },
    publicId: { type: String, default: null },
    variants: { type: imageVariantsSchema, default: () => ({}) },
    blurDataURL: { type: String, default: null },
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false }
);

const foodSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, default: null },
    images: { type: [imageSchema], default: [] },
    imageBlur: { type: String, default: null },
    stock: { type: Number, default: 0, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    isAvailable: { type: Boolean, default: true },
    tags: { type: [String], default: [], index: true },
  },
  { timestamps: true }
);

foodSchema.index({ restaurantId: 1, categoryId: 1 });

foodSchema.methods.toMobileJSON = function () {
  return {
    _id: this._id,
    name: this.name,
    description: this.description,
    price: this.price,
    image: this.image,
    images: this.images || [],
    imageBlur: this.imageBlur,
    stock: this.stock,
    isAvailable: this.isAvailable,
    ratingAverage: this.ratingAverage,
    ratingCount: this.ratingCount,
    tags: this.tags,
    categoryId: this.categoryId,
    restaurantId: this.restaurantId,
  };
};

module.exports = mongoose.model('Food', foodSchema);
