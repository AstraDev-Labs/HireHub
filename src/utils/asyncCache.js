const cache = new Map();

function getNow() {
    return Date.now();
}

async function getOrSetCached(key, ttlMs, loader) {
    const existing = cache.get(key);
    const now = getNow();

    if (existing) {
        if (existing.value !== undefined && existing.expiresAt > now) {
            return existing.value;
        }

        if (existing.promise) {
            return existing.promise;
        }
    }

    const promise = Promise.resolve().then(loader);
    cache.set(key, { promise, expiresAt: now + ttlMs });

    try {
        const value = await promise;
        cache.set(key, { value, expiresAt: getNow() + ttlMs });
        return value;
    } catch (error) {
        const current = cache.get(key);
        if (current && current.promise === promise) {
            cache.delete(key);
        }
        throw error;
    }
}

function clearCachedValue(key) {
    cache.delete(key);
}

function clearCacheByPrefix(prefix) {
    for (const key of cache.keys()) {
        if (key.startsWith(prefix)) {
            cache.delete(key);
        }
    }
}

function getCacheSize() {
    return cache.size;
}

module.exports = {
    getOrSetCached,
    clearCachedValue,
    clearCacheByPrefix,
    getCacheSize,
};
