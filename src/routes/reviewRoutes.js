const express = require('express');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/reviews
// @desc    Create a product review
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { product, rating, title, comment } = req.body;

    // Validation
    if (!product || !rating || !comment) {
      return res.status(400).json({ msg: 'Product, rating, and comment are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
    }

    // Check if product exists
    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ product, user: req.user.id });
    if (existingReview) {
      return res.status(400).json({ msg: 'You have already reviewed this product' });
    }

    // Check if user purchased this product (for verified badge)
    const userOrders = await Order.find({
      user: req.user.id,
      'items.product': product,
      paymentStatus: 'paid'
    });
    const verified = userOrders.length > 0;

    // Create review
    const review = await Review.create({
      product,
      user: req.user.id,
      rating,
      title,
      comment,
      verified
    });

    // Update product ratings
    await updateProductRating(product);

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name');

    res.status(201).json({
      msg: 'Review created successfully',
      review: populatedReview
    });

  } catch (error) {
    console.error('Create review error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ msg: 'You have already reviewed this product' });
    }
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/reviews/product/:productId
// @desc    Get reviews for a product
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const { sort = '-createdAt', limit = 10, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ product: req.params.productId })
      .populate('user', 'name')
      .sort(sort)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Review.countDocuments({ product: req.params.productId });

    res.json({
      reviews,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit))
    });

  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update own review
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const { rating, title, comment } = req.body;

    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }

    // Check ownership
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Not authorized to update this review' });
    }

    if (rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ msg: 'Rating must be between 1 and 5' });
      }
      review.rating = rating;
    }
    if (title !== undefined) review.title = title;
    if (comment) review.comment = comment;

    await review.save();

    // Update product ratings
    await updateProductRating(review.product);

    const updatedReview = await Review.findById(review._id)
      .populate('user', 'name');

    res.json({
      msg: 'Review updated successfully',
      review: updatedReview
    });

  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete own review
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }

    // Check ownership or admin
    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ msg: 'Not authorized to delete this review' });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(req.params.id);

    // Update product ratings
    await updateProductRating(productId);

    res.json({ msg: 'Review deleted successfully' });

  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Private
router.post('/:id/helpful', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ msg: 'Review not found' });
    }

    await review.markHelpful(req.user.id);

    res.json({
      msg: 'Review marked as helpful',
      helpful: review.helpful
    });

  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// Helper function to update product rating
async function updateProductRating(productId) {
  try {
    const reviews = await Review.find({ product: productId });
    
    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, {
        averageRating: 0,
        reviewCount: 0
      });
      return;
    }

    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / reviews.length;

    await Product.findByIdAndUpdate(productId, {
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount: reviews.length
    });
  } catch (error) {
    console.error('Error updating product rating:', error);
  }
}

module.exports = router;
