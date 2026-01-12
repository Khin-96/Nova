const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  verifiedPurchase: {
    type: Boolean,
    default: false
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  helpful: {
    type: Number,
    default: 0
  },
  reported: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Prevent duplicate reviews from same user on same product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

// Indexes for performance
reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1 });
reviewSchema.index({ rating: -1 });

// Auto-update product rating after review save/update/delete
reviewSchema.post('save', async function() {
  await updateProductRating(this.product);
});

reviewSchema.post('remove', async function() {
  await updateProductRating(this.product);
});

reviewSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await updateProductRating(doc.product);
  }
});

// Function to recalculate product rating
async function updateProductRating(productId) {
  try {
    const Review = mongoose.model('Review');
    const Product = mongoose.model('Product');
    
    const result = await Review.aggregate([
      { $match: { product: productId } },
      {
        $group: {
          _id: '$product',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    if (result.length > 0) {
      const { averageRating, reviewCount } = result[0];
      await Product.findByIdAndUpdate(productId, {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        reviewCount
      });
    } else {
      // No reviews, reset to default
      await Product.findByIdAndUpdate(productId, {
        rating: 0,
        reviewCount: 0
      });
    }
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}

reviewSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('Review', reviewSchema);
