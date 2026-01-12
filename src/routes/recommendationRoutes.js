const express = require('express');
const recommendationService = require('../services/recommendationService');
const { optionalAuth, protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/recommendations/personalized
// @desc    Get personalized recommendations for user
// @access  Private
router.get('/personalized', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const recommendations = await recommendationService.getPersonalizedRecommendations(
      req.user.id,
      limit
    );

    res.json({ recommendations });
  } catch (error) {
    console.error('Personalized recommendations error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/recommendations/popular
// @desc    Get popular/trending products
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await recommendationService.getPopularProducts(limit);

    res.json({ products });
  } catch (error) {
    console.error('Popular products error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/recommendations/trending
// @desc    Get trending products
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const days = parseInt(req.query.days) || 7;
    const products = await recommendationService.getTrendingProducts(limit, days);

    res.json({ products });
  } catch (error) {
    console.error('Trending products error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/recommendations/similar/:productId
// @desc    Get similar products
// @access  Public
router.get('/similar/:productId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const products = await recommendationService.getSimilarProducts(
      req.params.productId,
      limit
    );

    res.json({ products });
  } catch (error) {
    console.error('Similar products error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/recommendations/frequently-bought-together/:productId
// @desc    Get frequently bought together products
// @access  Public
router.get('/frequently-bought-together/:productId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    const products = await recommendationService.getFrequentlyBoughtTogether(
      req.params.productId,
      limit
    );

    res.json({ products });
  } catch (error) {
    console.error('Frequently bought together error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/recommendations/new-arrivals
// @desc    Get new arrival products
// @access  Public
router.get('/new-arrivals', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await recommendationService.getNewArrivals(limit);

    res.json({ products });
  } catch (error) {
    console.error('New arrivals error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

// @route   GET /api/recommendations/sale
// @desc    Get products on sale
// @access  Public
router.get('/sale', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await recommendationService.getSaleProducts(limit);

    res.json({ products });
  } catch (error) {
    console.error('Sale products error:', error);
    res.status(500).json({ msg: 'Server error' });
  }
});

module.exports = router;
