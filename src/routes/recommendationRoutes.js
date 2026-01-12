const express = require('express');
const router = express.Router();
const { optionalAuth } = require('../middleware/authMiddleware');
const {
  getPersonalizedRecommendations,
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getTrendingProducts,
  getNewArrivals,
  getBestsellers,
  getRecommendedByCategory
} = require('../services/recommendationService');

// @route   GET /api/recommendations/personalized
// @desc    Get personalized recommendations for user
// @access  Private (optional - returns trending if not authenticated)
router.get('/personalized', optionalAuth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    let recommendations;
    
    if (req.user && req.user.id) {
      recommendations = await getPersonalizedRecommendations(req.user.id, limit);
    } else {
      // Not authenticated, return trending products
      recommendations = await getTrendingProducts(limit);
    }

    res.json({
      recommendations,
      personalized: !!req.user
    });

  } catch (error) {
    console.error('Error fetching personalized recommendations:', error);
    res.status(500).json({ msg: 'Server error fetching recommendations.' });
  }
});

// @route   GET /api/recommendations/similar/:productId
// @desc    Get similar products based on a product
// @access  Public
router.get('/similar/:productId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    const similarProducts = await getSimilarProducts(req.params.productId, limit);

    res.json(similarProducts);

  } catch (error) {
    console.error('Error fetching similar products:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid product ID format.' });
    }
    res.status(500).json({ msg: 'Server error fetching similar products.' });
  }
});

// @route   GET /api/recommendations/bought-together/:productId
// @desc    Get frequently bought together products
// @access  Public
router.get('/bought-together/:productId', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    
    const products = await getFrequentlyBoughtTogether(req.params.productId, limit);

    res.json(products);

  } catch (error) {
    console.error('Error fetching bought together products:', error);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ msg: 'Invalid product ID format.' });
    }
    res.status(500).json({ msg: 'Server error fetching bought together products.' });
  }
});

// @route   GET /api/recommendations/trending
// @desc    Get trending products
// @access  Public
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const trendingProducts = await getTrendingProducts(limit);

    res.json(trendingProducts);

  } catch (error) {
    console.error('Error fetching trending products:', error);
    res.status(500).json({ msg: 'Server error fetching trending products.' });
  }
});

// @route   GET /api/recommendations/new-arrivals
// @desc    Get new arrival products
// @access  Public
router.get('/new-arrivals', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const newArrivals = await getNewArrivals(limit);

    res.json(newArrivals);

  } catch (error) {
    console.error('Error fetching new arrivals:', error);
    res.status(500).json({ msg: 'Server error fetching new arrivals.' });
  }
});

// @route   GET /api/recommendations/bestsellers
// @desc    Get bestselling products
// @access  Public
router.get('/bestsellers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const bestsellers = await getBestsellers(limit);

    res.json(bestsellers);

  } catch (error) {
    console.error('Error fetching bestsellers:', error);
    res.status(500).json({ msg: 'Server error fetching bestsellers.' });
  }
});

// @route   GET /api/recommendations/category/:category
// @desc    Get recommendations by category
// @access  Public
router.get('/category/:category', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const exclude = req.query.exclude ? req.query.exclude.split(',') : [];
    
    const products = await getRecommendedByCategory(
      req.params.category,
      exclude,
      limit
    );

    res.json(products);

  } catch (error) {
    console.error('Error fetching recommendations by category:', error);
    res.status(500).json({ msg: 'Server error fetching recommendations.' });
  }
});

module.exports = router;
