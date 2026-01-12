const Product = require('../models/Product');
const User = require('../models/User');
const Order = require('../models/Order');

class RecommendationService {
  
  // Get personalized recommendations for a user
  async getPersonalizedRecommendations(userId, limit = 10) {
    try {
      const user = await User.findById(userId)
        .populate('viewHistory.product')
        .populate('purchaseHistory.product')
        .populate('wishlist');

      if (!user) {
        return this.getPopularProducts(limit);
      }

      // Combine multiple recommendation strategies
      const recommendations = new Set();
      
      // 1. Collaborative filtering - based on similar users
      const collaborativeRecs = await this.getCollaborativeRecommendations(user, limit);
      collaborativeRecs.forEach(p => recommendations.add(p._id.toString()));

      // 2. Content-based - based on user's view/purchase history
      const contentRecs = await this.getContentBasedRecommendations(user, limit);
      contentRecs.forEach(p => recommendations.add(p._id.toString()));

      // 3. Fill remaining with popular products
      if (recommendations.size < limit) {
        const popular = await this.getPopularProducts(limit - recommendations.size);
        popular.forEach(p => recommendations.add(p._id.toString()));
      }

      // Convert back to product documents
      const productIds = Array.from(recommendations).slice(0, limit);
      const products = await Product.find({ _id: { $in: productIds } });

      return products;

    } catch (error) {
      console.error('Personalized recommendations error:', error);
      return this.getPopularProducts(limit);
    }
  }

  // Collaborative filtering - find similar users and recommend what they bought
  async getCollaborativeRecommendations(user, limit = 10) {
    try {
      // Get products the user has viewed or purchased
      const userProductIds = [
        ...user.viewHistory.map(v => v.product._id || v.product),
        ...user.purchaseHistory.map(p => p.product._id || p.product),
        ...user.wishlist.map(w => w._id || w)
      ].map(id => id.toString());

      if (userProductIds.length === 0) {
        return [];
      }

      // Find other users who viewed/purchased similar products
      const similarUsers = await User.find({
        _id: { $ne: user._id },
        $or: [
          { 'viewHistory.product': { $in: userProductIds } },
          { 'purchaseHistory.product': { $in: userProductIds } },
          { 'wishlist': { $in: userProductIds } }
        ]
      })
      .populate('purchaseHistory.product')
      .populate('viewHistory.product')
      .limit(50);

      // Get products that similar users bought but current user hasn't
      const recommendedProductIds = new Set();
      
      similarUsers.forEach(similarUser => {
        similarUser.purchaseHistory.forEach(purchase => {
          const productId = (purchase.product._id || purchase.product).toString();
          if (!userProductIds.includes(productId)) {
            recommendedProductIds.add(productId);
          }
        });
      });

      // Get the actual products
      const products = await Product.find({
        _id: { $in: Array.from(recommendedProductIds) }
      })
      .sort({ purchaseCount: -1 })
      .limit(limit);

      return products;

    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return [];
    }
  }

  // Content-based recommendations - based on product attributes
  async getContentBasedRecommendations(user, limit = 10) {
    try {
      // Analyze user's viewing and purchase history
      const viewedProducts = user.viewHistory
        .filter(v => v.product && v.product._id)
        .map(v => v.product);
      
      const purchasedProducts = user.purchaseHistory
        .filter(p => p.product && p.product._id)
        .map(p => p.product);

      const allProducts = [...viewedProducts, ...purchasedProducts];

      if (allProducts.length === 0) {
        return [];
      }

      // Extract categories user is interested in
      const categoryCount = {};
      allProducts.forEach(product => {
        const category = product.category;
        categoryCount[category] = (categoryCount[category] || 0) + 1;
      });

      // Get top categories
      const topCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([category]) => category);

      // Get user's product IDs to exclude
      const userProductIds = [
        ...user.viewHistory.map(v => (v.product._id || v.product).toString()),
        ...user.purchaseHistory.map(p => (p.product._id || p.product).toString()),
        ...user.wishlist.map(w => (w._id || w).toString())
      ];

      // Find similar products in those categories
      const recommendations = await Product.find({
        category: { $in: topCategories },
        _id: { $nin: userProductIds }
      })
      .sort({ averageRating: -1, viewCount: -1 })
      .limit(limit);

      return recommendations;

    } catch (error) {
      console.error('Content-based recommendations error:', error);
      return [];
    }
  }

  // Get popular/trending products
  async getPopularProducts(limit = 10) {
    try {
      const products = await Product.find({
        tags: { $ne: 'out-of-stock' }
      })
      .sort({ 
        purchaseCount: -1, 
        viewCount: -1, 
        averageRating: -1 
      })
      .limit(limit);

      return products;
    } catch (error) {
      console.error('Get popular products error:', error);
      return [];
    }
  }

  // Get "Frequently bought together" recommendations
  async getFrequentlyBoughtTogether(productId, limit = 4) {
    try {
      // Find orders that contain this product
      const orders = await Order.find({
        'items.product': productId,
        paymentStatus: 'paid'
      }).populate('items.product');

      // Count how often other products appear with this one
      const productCount = {};
      
      orders.forEach(order => {
        order.items.forEach(item => {
          const itemProductId = item.product._id.toString();
          if (itemProductId !== productId.toString()) {
            productCount[itemProductId] = (productCount[itemProductId] || 0) + 1;
          }
        });
      });

      // Sort by frequency and get top products
      const frequentProductIds = Object.entries(productCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id]) => id);

      const products = await Product.find({
        _id: { $in: frequentProductIds }
      });

      return products;

    } catch (error) {
      console.error('Frequently bought together error:', error);
      return [];
    }
  }

  // Get similar products based on category and attributes
  async getSimilarProducts(productId, limit = 6) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        return [];
      }

      // Find products in the same category with similar price range
      const priceRange = product.price * 0.3; // +/- 30%
      
      const similarProducts = await Product.find({
        _id: { $ne: productId },
        category: product.category,
        price: {
          $gte: product.price - priceRange,
          $lte: product.price + priceRange
        },
        tags: { $ne: 'out-of-stock' }
      })
      .sort({ averageRating: -1, viewCount: -1 })
      .limit(limit);

      // If not enough similar products, fill with same category
      if (similarProducts.length < limit) {
        const additional = await Product.find({
          _id: { 
            $ne: productId,
            $nin: similarProducts.map(p => p._id)
          },
          category: product.category,
          tags: { $ne: 'out-of-stock' }
        })
        .sort({ averageRating: -1 })
        .limit(limit - similarProducts.length);

        similarProducts.push(...additional);
      }

      return similarProducts;

    } catch (error) {
      console.error('Similar products error:', error);
      return [];
    }
  }

  // Get trending products (high recent view/purchase activity)
  async getTrendingProducts(limit = 10, days = 7) {
    try {
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - days);

      // This would ideally use time-series data
      // For now, we'll use a combination of recent metrics
      const products = await Product.find({
        tags: { $ne: 'out-of-stock' },
        updatedAt: { $gte: dateThreshold }
      })
      .sort({ 
        viewCount: -1,
        purchaseCount: -1,
        averageRating: -1
      })
      .limit(limit);

      return products;

    } catch (error) {
      console.error('Trending products error:', error);
      return [];
    }
  }

  // Get new arrivals
  async getNewArrivals(limit = 10) {
    try {
      const products = await Product.find({
        tags: 'new'
      })
      .sort({ createdAt: -1 })
      .limit(limit);

      return products;
    } catch (error) {
      console.error('New arrivals error:', error);
      return [];
    }
  }

  // Get products on sale
  async getSaleProducts(limit = 10) {
    try {
      const products = await Product.find({
        tags: 'sale'
      })
      .sort({ price: 1 })
      .limit(limit);

      return products;
    } catch (error) {
      console.error('Sale products error:', error);
      return [];
    }
  }
}

module.exports = new RecommendationService();
