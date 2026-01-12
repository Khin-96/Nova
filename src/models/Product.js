const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  image: { type: String, required: true },
  imagePublicId: { type: String }, // Cloudinary public ID for deletion
  images: [{ type: String }], // Additional product images
  tags: {
    type: [String],
    enum: ['new', 'out-of-stock', 'coming-soon', 'sale'],
    default: []
  },
  sizes: {
    type: [String],
    enum: ['S', 'M', 'L', 'XL'],
    default: ['S', 'M', 'L', 'XL']
  },
  // Inventory tracking per size
  inventory: {
    S: { type: Number, default: 0 },
    M: { type: Number, default: 0 },
    L: { type: Number, default: 0 },
    XL: { type: Number, default: 0 }
  },
  // Analytics and ratings
  views: { type: Number, default: 0 },
  salesCount: { type: Number, default: 0 },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviewCount: { type: Number, default: 0 },
  // Additional product information
  colors: [{ type: String }],
  material: { type: String },
  relatedProducts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }]
}, {
  timestamps: true
});

productSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

productSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

// Indexes for performance
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' }); // Text search
productSchema.index({ rating: -1 });
productSchema.index({ salesCount: -1 });
productSchema.index({ views: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ tags: 1 });

// Method to update rating based on reviews
productSchema.methods.updateRating = async function(newRating, reviewCount) {
  this.rating = newRating;
  this.reviewCount = reviewCount;
  await this.save();
};

// Method to increment views
productSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
};

// Method to update inventory after order
productSchema.methods.decreaseInventory = async function(size, quantity) {
  if (this.inventory[size] >= quantity) {
    this.inventory[size] -= quantity;
    this.salesCount += quantity;
    await this.save();
    return true;
  }
  return false;
};

module.exports = mongoose.model('Product', productSchema);