const mongoose = require('mongoose');
const { RESTAURANT_STATUSES } = require('../constants');

const variantSchema = new mongoose.Schema(
  {
    thumb: { type: String, default: null },
    card: { type: String, default: null },
    detail: { type: String, default: null },
    original: { type: String, default: null },
  },
  { _id: false }
);

const restaurantSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, maxlength: 1000 },
    coverImage: { type: String, default: null },
    coverImageVariants: { type: variantSchema, default: () => ({}) },
    logo: { type: String, default: null },
    logoVariants: { type: variantSchema, default: () => ({}) },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] },
    },
    latitude: { type: Number },
    longitude: { type: Number },
    locationUpdatedAt: { type: Date },
    status: {
      type: String,
      enum: Object.values(RESTAURANT_STATUSES),
      default: RESTAURANT_STATUSES.PENDING,
    },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    foodSafetyCertificate: { type: String, default: null },
    foodSafetyCertificateAt: { type: Date, default: null },
  },
  { timestamps: true }
);

restaurantSchema.index({ location: '2dsphere' });
restaurantSchema.index({ name: 'text', description: 'text' });

restaurantSchema.pre('save', function (next) {
  if (this.latitude != null && this.longitude != null) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude],
    };
    this.locationUpdatedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
module.exports.RESTAURANT_STATUSES = RESTAURANT_STATUSES;
