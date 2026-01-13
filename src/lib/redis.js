const Redis = require('ioredis');

let redis;

if (process.env.REDIS_URL) {
    redis = new Redis(process.env.REDIS_URL);

    redis.on('connect', () => console.log('Redis connected'));
    redis.on('error', (err) => console.error('Redis connection error:', err));
} else {
    console.warn('REDIS_URL not set. Redis disabled.');
    // Mock interface to prevent crashes if not configured
    redis = {
        get: async () => null,
        set: async () => 'OK',
        incr: async () => 1,
        expire: async () => 1,
        zincrby: async () => 1, // For sorted sets (scores)
        zrevrange: async () => [], // Get top items
        hincrby: async () => 1,
        hgetall: async () => ({}),
        lpush: async () => 1,
        ltrim: async () => 'OK'
    };
}

module.exports = redis;
