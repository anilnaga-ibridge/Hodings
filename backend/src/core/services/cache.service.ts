import Redis from "ioredis";

class CacheService {
  private redis: Redis | null = null;
  private memoryCache = new Map<string, { value: any; expiresAt: number }>();
  private isRedisConnected = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    try {
      // Create Redis client with a quick timeout so it doesn't hang the app if offline
      this.redis = new Redis(redisUrl, {
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // Do not retry on connection failure
      });

      this.redis.on("connect", () => {
        console.log("Successfully connected to Redis cache.");
        this.isRedisConnected = true;
      });

      this.redis.on("error", (err) => {
        if (this.isRedisConnected) {
          console.warn("Redis connection error, falling back to memory cache:", err.message);
        }
        this.isRedisConnected = false;
      });
    } catch (err) {
      console.warn("Could not initialize Redis client, using in-memory cache fallback:", err);
      this.redis = null;
      this.isRedisConnected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isRedisConnected && this.redis) {
      try {
        const value = await this.redis.get(key);
        return value ? JSON.parse(value) : null;
      } catch (err) {
        console.error("Redis get error:", err);
      }
    }

    // In-memory fallback
    const cached = this.memoryCache.get(key);
    if (!cached) return null;

    if (Date.now() > cached.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }

    return cached.value as T;
  }

  async set(key: string, value: any, ttlSeconds: number): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
        return;
      } catch (err) {
        console.error("Redis set error:", err);
      }
    }

    // In-memory fallback
    this.memoryCache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  async del(key: string): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        await this.redis.del(key);
        return;
      } catch (err) {
        console.error("Redis del error:", err);
      }
    }

    // In-memory fallback
    this.memoryCache.delete(key);
  }

  async invalidatePrefix(prefix: string): Promise<void> {
    if (this.isRedisConnected && this.redis) {
      try {
        const keys = await this.redis.keys(`${prefix}*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
        return;
      } catch (err) {
        console.error("Redis key invalidation error:", err);
      }
    }

    // In-memory fallback
    for (const key of this.memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        this.memoryCache.delete(key);
      }
    }
  }
}

export const cacheService = new CacheService();
