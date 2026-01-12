const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Product = require('../models/Product');
const { authenticateToken } = require('../middleware/authMiddleware');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('wishlist', 'name image price')
      .populate('viewHistory.product', 'name image price');

    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    res.json(user);

  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ msg: 'Server error fetching profile.' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, preferences } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    if (name) user.name = name;
    if (preferences) {
      if (preferences.favoriteCategories) {
        user.preferences.favoriteCategories = preferences.favoriteCategories;
      }
      if (preferences.preferredSizes) {
        user.preferences.preferredSizes = preferences.preferredSizes;
      }
    }

    await user.save();

    res.json({
      msg: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ msg: 'Server error updating profile.' });
  }
});

// @route   GET /api/users/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/wishlist', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('wishlist', 'name image price category tags rating reviewCount');

    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    res.json(user.wishlist);

  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ msg: 'Server error fetching wishlist.' });
  }
});

// @route   POST /api/users/wishlist/:productId
// @desc    Add product to wishlist
// @access  Private
router.post('/wishlist/:productId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    // Check if product exists
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found.' });
    }

    // Check if already in wishlist
    if (user.wishlist.includes(req.params.productId)) {
      return res.status(400).json({ msg: 'Product already in wishlist.' });
    }

    user.wishlist.push(req.params.productId);
    await user.save();

    res.json({
      msg: 'Product added to wishlist.',
      wishlist: user.wishlist
    });

  } catch (error) {
    console.error('Error adding to wishlist:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid product ID format.' });
    }
    res.status(500).json({ msg: 'Server error adding to wishlist.' });
  }
});

// @route   DELETE /api/users/wishlist/:productId
// @desc    Remove product from wishlist
// @access  Private
router.delete('/wishlist/:productId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    // Remove product from wishlist
    user.wishlist = user.wishlist.filter(
      item => item.toString() !== req.params.productId
    );

    await user.save();

    res.json({
      msg: 'Product removed from wishlist.',
      wishlist: user.wishlist
    });

  } catch (error) {
    console.error('Error removing from wishlist:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid product ID format.' });
    }
    res.status(500).json({ msg: 'Server error removing from wishlist.' });
  }
});

// @route   GET /api/users/view-history
// @desc    Get user's view history
// @access  Private
router.get('/view-history', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('viewHistory.product', 'name image price category rating');

    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    // Sort by most recent first
    const sortedHistory = user.viewHistory
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, 50); // Limit to 50 items

    res.json(sortedHistory);

  } catch (error) {
    console.error('Error fetching view history:', error);
    res.status(500).json({ msg: 'Server error fetching view history.' });
  }
});

// @route   POST /api/users/view-history/:productId
// @desc    Add product to view history
// @access  Private
router.post('/view-history/:productId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    // Check if product exists
    const product = await Product.findById(req.params.productId);
    if (!product) {
      return res.status(404).json({ msg: 'Product not found.' });
    }

    // Remove product if already in history (to update timestamp)
    user.viewHistory = user.viewHistory.filter(
      item => item.product.toString() !== req.params.productId
    );

    // Add to beginning of history
    user.viewHistory.push({
      product: req.params.productId,
      viewedAt: new Date()
    });

    // Limit to last 50 items (already handled in User model pre-save hook, but ensure here too)
    if (user.viewHistory.length > 50) {
      user.viewHistory = user.viewHistory.slice(-50);
    }

    await user.save();

    // Also increment product view count
    await product.incrementViews();

    res.json({ msg: 'View recorded.' });

  } catch (error) {
    console.error('Error recording view:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid product ID format.' });
    }
    res.status(500).json({ msg: 'Server error recording view.' });
  }
});

// @route   DELETE /api/users/view-history/:productId
// @desc    Remove product from view history
// @access  Private
router.delete('/view-history/:productId', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    user.viewHistory = user.viewHistory.filter(
      item => item.product.toString() !== req.params.productId
    );

    await user.save();

    res.json({ msg: 'Item removed from view history.' });

  } catch (error) {
    console.error('Error removing from view history:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid product ID format.' });
    }
    res.status(500).json({ msg: 'Server error removing from view history.' });
  }
});

// @route   DELETE /api/users/view-history
// @desc    Clear all view history
// @access  Private
router.delete('/view-history', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found.' });
    }

    user.viewHistory = [];
    await user.save();

    res.json({ msg: 'View history cleared.' });

  } catch (error) {
    console.error('Error clearing view history:', error);
    res.status(500).json({ msg: 'Server error clearing view history.' });
  }
});

module.exports = router;
