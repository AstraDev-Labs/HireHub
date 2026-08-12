const { createClient } = require('redis');

const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379'
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Redis Connected'));

// Connect immediately, catch errors but don't crash
redisClient.connect().catch(err => console.error('❌ Redis Connection Failed:', err));

async function getOrSetCached(key, ttlMs, loader) {
    if (!redisClient.isReady) {
        // Fallback if Redis is down
        return await loader();
    }

    try {
        const cached = await redisClient.get(key);
        if (cached) {
            return JSON.parse(cached);
        }

        const value = await loader();
        // Redis SETEX takes seconds, not ms
        const ttlSeconds = Math.max(1, Math.floor(ttlMs / 1000));
        await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
        return value;
    } catch (error) {
        console.error(`❌ Cache error for key ${key}, falling back to loader`, error);
        return await loader();
    }
}

async function clearCachedValue(key) {
    if (redisClient.isReady) {
        try {
            await redisClient.del(key);
        } catch (error) {
            console.error(`❌ Failed to clear cache for ${key}`, error);
        }
    }
}

async function clearCacheByPrefix(prefix) {
    if (!redisClient.isReady) return;
    try {
        // Use SCAN or KEYS to find matches and delete them. KEYS is fine for low traffic/simple prefixes.
        const keys = await redisClient.keys(`${prefix}*`);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    } catch (error) {
        console.error(`❌ Failed to clear cache prefix ${prefix}`, error);
    }
}

async function getCacheSize() {
    if (!redisClient.isReady) return 0;
    try {
        return await redisClient.dbSize();
    } catch (error) {
        return 0;
    }
}

module.exports = {
    getOrSetCached,
    clearCachedValue,
    clearCacheByPrefix,
    getCacheSize,
    redisClient
};
