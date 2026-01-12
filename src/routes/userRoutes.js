const express = require('express');
const User = require('../models/User');
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/users/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/wishlist', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('wishlist', 'name price image category tags averageRating reviewCount');
    res.json({ wishlist: user.wishlist });
  } catch (error) {
    console.error('Get wishlist error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/users/wishlist/:productId
// @desc    Add product to wishlist
// @access  Private
router.post('/wishlist/:productId', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    const user = await User.findById(req.user.id);
    await user.addToWishlist(req.params.productId);

    res.json({ msg: 'Product added to wishlist' });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   DELETE /api/users/wishlist/:productId
// @desc    Remove product from wishlist
// @access  Private
router.delete('/wishlist/:productId', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    await user.removeFromWishlist(req.params.productId);

    res.json({ msg: 'Product removed from wishlist' });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/users/view-history
// @desc    Get user's view history
// @access  Private
router.get('/view-history', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('viewHistory.product', 'name price image category tags averageRating');
    
    res.json({ viewHistory: user.viewHistory });
  } catch (error) {
    console.error('Get view history error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   POST /api/users/view-history/:productId
// @desc    Add product to view history
// @access  Private (but also tracked for non-authenticated via middleware)
router.post('/view-history/:productId', protect, async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    // Increment product view count
    product.viewCount = (product.viewCount || 0) + 1;
    await product.save();

    // Add to user's view history
    const user = await User.findById(req.user.id);
    await user.addToViewHistory(req.params.productId);

    res.json({ msg: 'View recorded' });
  } catch (error) {
    console.error('Add to view history error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
