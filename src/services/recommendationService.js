const redis = require('../lib/redis');
const { sendEvent } = require('../lib/kafka');

const TRACKING_TOPIC = 'user-activity';

// Track a user action (View, AddToCart, Buy)
async function trackUserAction(userId, action, metadata = {}) {
    // 1. Send to Kafka for long-term storage/analytics
    await sendEvent(TRACKING_TOPIC, {
        userId,
        action,
        timestamp: new Date().toISOString(),
        ...metadata
    });

    // 2. Update Real-time Profile in Redis
    if (userId) {
        const profileKey = `user:${userId}:profile`;

        // If viewing/buying a specific category, increment score
        if (metadata.category) {
            await redis.zincrby(`${profileKey}:categories`, 1, metadata.category);
            await redis.expire(`${profileKey}:categories`, 60 * 60 * 24 * 30); // 30 days
        }

        // Track last seen products
        if (metadata.productId) {
            await redis.lpush(`${profileKey}:history`, metadata.productId);
            await redis.ltrim(`${profileKey}:history`, 0, 9); // Keep last 10
            await redis.expire(`${profileKey}:history`, 60 * 60 * 24 * 30);
        }
    }
}

// Get Recommendations based on Redis profile
async function getRecommendations(userId) {
    if (!userId) return [];

    const profileKey = `user:${userId}:profile`;

    // Get top categories
    const topCategories = await redis.zrevrange(`${profileKey}:categories`, 0, 2);

    if (!topCategories || topCategories.length === 0) {
        return []; // No history, return empty (fallback to featured)
    }

    return {
        topCategories,
        // In a real app, you'd fetch product IDs from DB matching these categories here
        debug: `User likes ${topCategories.join(', ')}`
    };
}

module.exports = { trackUserAction, getRecommendations };
