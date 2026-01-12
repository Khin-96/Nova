const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { authenticateToken } = require('../middleware/authMiddleware');

// @route   POST /api/reviews
// @desc    Create a new review
// @access  Private
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { product, rating, title, comment, orderId } = req.body;

    // Validation
    if (!product || !rating || !comment) {
      return res.status(400).json({ msg: 'Product, rating, and comment are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ msg: 'Rating must be between 1 and 5.' });
    }

    // Check if product exists
    const productExists = await Product.findById(product);
    if (!productExists) {
      return res.status(404).json({ msg: 'Product not found.' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({
      product,
      user: req.user.id
    });

    if (existingReview) {
      return res.status(400).json({ msg: 'You have already reviewed this product. You can update your existing review.' });
    }

    // Check if this is a verified purchase
    let verifiedPurchase = false;
    let orderRef = null;

    if (orderId) {
      const order = await Order.findOne({
        _id: orderId,
        user: req.user.id,
        'items.product': product,
        orderStatus: 'delivered'
      });

      if (order) {
        verifiedPurchase = true;
        orderRef = orderId;
      }
    } else {
      // Check if user has purchased this product
      const order = await Order.findOne({
        user: req.user.id,
        'items.product': product,
        orderStatus: 'delivered'
      });

      if (order) {
        verifiedPurchase = true;
        orderRef = order._id;
      }
    }

    // Create review
    const newReview = new Review({
      product,
      user: req.user.id,
      rating,
      title,
      comment,
      verifiedPurchase,
      order: orderRef
    });

    await newReview.save();

    // Populate user info for response
    await newReview.populate('user', 'name');

    res.status(201).json({
      msg: 'Review submitted successfully!',
      review: newReview
    });

  } catch (error) {
    console.error('Review creation error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ msg: 'You have already reviewed this product.' });
    }
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ msg: errors[0] || 'Validation failed.' });
    }
    res.status(500).json({ msg: 'Server error during review creation.' });
  }
});

// @route   GET /api/reviews/product/:productId
// @desc    Get all reviews for a product with pagination
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const { page = 1, limit = 10, sort = 'recent' } = req.query;
    
    let sortOption = { createdAt: -1 }; // Default: most recent first
    if (sort === 'rating-high') {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (sort === 'rating-low') {
      sortOption = { rating: 1, createdAt: -1 };
    } else if (sort === 'helpful') {
      sortOption = { helpful: -1, createdAt: -1 };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ 
      product: req.params.productId,
      reported: false 
    })
      .populate('user', 'name')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ 
      product: req.params.productId,
      reported: false 
    });

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(req.params.productId), reported: false } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      },
      ratingDistribution
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid product ID format.' });
    }
    res.status(500).json({ msg: 'Server error fetching reviews.' });
  }
});

// @route   GET /api/reviews/user
// @desc    Get user's reviews
// @access  Private
router.get('/user', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ user: req.user.id })
      .populate('product', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ user: req.user.id });

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ msg: 'Server error fetching reviews.' });
  }
});

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private (Own review only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { rating, title, comment } = req.body;

    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ msg: 'Review not found.' });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied.' });
    }

    // Update fields
    if (rating) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ msg: 'Rating must be between 1 and 5.' });
      }
      review.rating = rating;
    }
    if (title !== undefined) review.title = title;
    if (comment) review.comment = comment;

    await review.save();
    await review.populate('user', 'name');

    res.json({
      msg: 'Review updated successfully.',
      review
    });

  } catch (error) {
    console.error('Error updating review:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid review ID format.' });
    }
    res.status(500).json({ msg: 'Server error updating review.' });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private (Own review only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ msg: 'Review not found.' });
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied.' });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({ msg: 'Review deleted successfully.' });

  } catch (error) {
    console.error('Error deleting review:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid review ID format.' });
    }
    res.status(500).json({ msg: 'Server error deleting review.' });
  }
});

// @route   PUT /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Public
router.put('/:id/helpful', async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({ msg: 'Review not found.' });
    }

    review.helpful += 1;
    await review.save();

    res.json({ msg: 'Thank you for your feedback!', helpful: review.helpful });

  } catch (error) {
    console.error('Error marking review as helpful:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid review ID format.' });
    }
    res.status(500).json({ msg: 'Server error.' });
  }
});

module.exports = router;
