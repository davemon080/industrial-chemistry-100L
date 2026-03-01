import { createClient, type RedisClientType } from 'redis';

// Redis connection configuration
const REDIS_URL = import.meta.env.VITE_REDIS_URL || 'redis://localhost:6379';

class RedisService {
  private client: RedisClientType | null = null;
  private isConnected = false;

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      this.client = createClient({
        url: REDIS_URL,
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      await this.client.connect();
      this.isConnected = true;
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Redis connection error:', error);
      // Don't throw - app can work without Redis
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
      this.client = null;
    }
  }

  // Cache operations
  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.isConnected) return null;
    
    try {
      const value = await this.client.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
    if (!this.client || !this.isConnected) return;
    
    try {
      await this.client.setEx(key, ttlSeconds, JSON.stringify(value));
    } catch (error) {
      console.error('Redis set error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.client || !this.isConnected) return;
    
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
    } catch (error) {
      console.error('Redis invalidate pattern error:', error);
    }
  }

  // Specific cache keys
  getUserKey(userId: string): string {
    return `user:${userId}`;
  }

  getSchedulesKey(date: string): string {
    return `schedules:${date}`;
  }

  getUserSchedulesKey(userId: string): string {
    return `user:${userId}:schedules`;
  }

  getNotificationsKey(userId: string): string {
    return `user:${userId}:notifications`;
  }

  isRedisConnected(): boolean {
    return this.isConnected;
  }
}

export const redis = new RedisService();
export default redis;
