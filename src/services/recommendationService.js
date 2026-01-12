const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * Get personalized recommendations based on user behavior
 * Uses collaborative filtering approach
 */
const getPersonalizedRecommendations = async (userId, limit = 10) => {
  try {
    const user = await User.findById(userId).populate('viewHistory.product wishlist');
    
    if (!user) {
      return [];
    }

    // Get user's viewed and wishlisted product IDs
    const viewedProductIds = user.viewHistory.map(item => item.product._id || item.product);
    const wishlistProductIds = user.wishlist.map(item => item._id || item);
    const interactedProductIds = [...new Set([...viewedProductIds, ...wishlistProductIds])];

    if (interactedProductIds.length === 0) {
      // No history, return trending products
      return getTrendingProducts(limit);
    }

    // Get categories user is interested in
    const interactedProducts = await Product.find({ _id: { $in: interactedProductIds } });
    const userCategories = [...new Set(interactedProducts.map(p => p.category))];

    // Find similar products in same categories
    const recommendations = await Product.find({
      _id: { $nin: interactedProductIds }, // Exclude already viewed/wishlisted
      category: { $in: userCategories },
      'tags': { $ne: 'out-of-stock' }
    })
      .sort({ rating: -1, salesCount: -1 }) // Prioritize high-rated and popular items
      .limit(limit);

    return recommendations;

  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return [];
  }
};

/**
 * Get similar products based on category, tags, and attributes
 * Content-based filtering
 */
const getSimilarProducts = async (productId, limit = 6) => {
  try {
    const product = await Product.findById(productId);
    
    if (!product) {
      return [];
    }

    // Build similarity query
    const query = {
      _id: { $ne: productId }, // Exclude the product itself
      'tags': { $ne: 'out-of-stock' }
    };

    // Prioritize same category
    if (product.category) {
      query.category = product.category;
    }

    const similarProducts = await Product.find(query)
      .sort({ 
        rating: -1,
        salesCount: -1
      })
      .limit(limit);

    // If not enough products in same category, expand search
    if (similarProducts.length < limit) {
      const additionalProducts = await Product.find({
        _id: { 
          $ne: productId,
          $nin: similarProducts.map(p => p._id)
        },
        'tags': { $ne: 'out-of-stock' }
      })
        .sort({ rating: -1, salesCount: -1 })
        .limit(limit - similarProducts.length);

      return [...similarProducts, ...additionalProducts];
    }

    return similarProducts;

  } catch (error) {
    console.error('Error getting similar products:', error);
    return [];
  }
};

/**
 * Get frequently bought together products
 * Analyzes order data to find product associations
 */
const getFrequentlyBoughtTogether = async (productId, limit = 4) => {
  try {
    // Find orders that include this product
    const orders = await Order.find({
      'items.product': productId,
      orderStatus: { $nin: ['cancelled'] }
    }).select('items');

    if (orders.length === 0) {
      return [];
    }

    // Count co-occurrences of products
    const productCounts = {};
    
    orders.forEach(order => {
      const orderProducts = order.items
        .map(item => item.product.toString())
        .filter(id => id !== productId.toString());

      orderProducts.forEach(prodId => {
        productCounts[prodId] = (productCounts[prodId] || 0) + 1;
      });
    });

    // Sort by frequency
    const sortedProducts = Object.entries(productCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([prodId]) => prodId);

    // Fetch product details
    const products = await Product.find({
      _id: { $in: sortedProducts },
      'tags': { $ne: 'out-of-stock' }
    });

    // Sort by original frequency order
    const orderedProducts = sortedProducts
      .map(id => products.find(p => p._id.toString() === id))
      .filter(p => p !== undefined);

    return orderedProducts;

  } catch (error) {
    console.error('Error getting frequently bought together:', error);
    return [];
  }
};

/**
 * Get trending products (last 7 days)
 * Based on views and sales
 */
const getTrendingProducts = async (limit = 10) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get products with recent activity
    const trendingProducts = await Product.find({
      'tags': { $ne: 'out-of-stock' },
      updatedAt: { $gte: sevenDaysAgo }
    })
      .sort({ 
        views: -1,
        salesCount: -1,
        rating: -1
      })
      .limit(limit);

    return trendingProducts;

  } catch (error) {
    console.error('Error getting trending products:', error);
    return [];
  }
};

/**
 * Get new arrivals
 */
const getNewArrivals = async (limit = 10) => {
  try {
    const newProducts = await Product.find({
      'tags': { $ne: 'out-of-stock' }
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return newProducts;

  } catch (error) {
    console.error('Error getting new arrivals:', error);
    return [];
  }
};

/**
 * Get bestsellers
 * Based on sales count
 */
const getBestsellers = async (limit = 10) => {
  try {
    const bestsellers = await Product.find({
      'tags': { $ne: 'out-of-stock' }
    })
      .sort({ 
        salesCount: -1,
        rating: -1
      })
      .limit(limit);

    return bestsellers;

  } catch (error) {
    console.error('Error getting bestsellers:', error);
    return [];
  }
};

/**
 * Get products user might like based on category preferences
 */
const getRecommendedByCategory = async (category, excludeIds = [], limit = 10) => {
  try {
    const products = await Product.find({
      category,
      _id: { $nin: excludeIds },
      'tags': { $ne: 'out-of-stock' }
    })
      .sort({ rating: -1, salesCount: -1 })
      .limit(limit);

    return products;

  } catch (error) {
    console.error('Error getting recommendations by category:', error);
    return [];
  }
};

module.exports = {
  getPersonalizedRecommendations,
  getSimilarProducts,
  getFrequentlyBoughtTogether,
  getTrendingProducts,
  getNewArrivals,
  getBestsellers,
  getRecommendedByCategory
};
