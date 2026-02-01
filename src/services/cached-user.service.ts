import { prisma } from "../lib/prisma";
import { CacheService } from "./cache.service";
import { logger } from "../utils/logger";

export class CachedUserService {
  private cache: CacheService;

  constructor() {
    this.cache = new CacheService('./cache_users.db'); // Separate cache DB for users
  }

  async getUserProfile(userId: number) {
    const cacheKey = `user:profile:${userId}`;

    // Try to get from cache first
    let result = await this.cache.get(cacheKey);

    if (result) {
      logger.info(`Cache hit for ${cacheKey}`);
      return result;
    }

    logger.info(`Cache miss for ${cacheKey}, fetching from database`);

    // If not in cache, get from the database
    result = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        created_at: true,
        profile: true,
        _count: {
          select: {
            orders: true,
            cart: true,
            wishlist: true
          }
        }
      }
    });

    if (!result) {
      return null;
    }

    // Store in cache with TTL of 15 minutes (user profiles change less frequently)
    await this.cache.set(cacheKey, result, 15 * 60); // 15 minutes in seconds

    return result;
  }

  async updateUserProfile(userId: number, profileData: any) {
    // Clear the user profile cache when updating
    await this.cache.delete(`user:profile:${userId}`);

    // Update the user in the database
    const result = await prisma.user.update({
      where: { id: userId },
      data: profileData,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        created_at: true,
        profile: true,
        _count: {
          select: {
            orders: true,
            cart: true,
            wishlist: true
          }
        }
      }
    });

    // Store updated profile in cache
    await this.cache.set(`user:profile:${userId}`, result, 15 * 60);

    return result;
  }

  async clearUserProfileCache(userId: number) {
    await this.cache.delete(`user:profile:${userId}`);
  }

  async clearAllUserCache() {
    // For simplicity, we'll clear all user caches
    // In a real application, you might want to be more selective
    await this.cache.clear();
  }
}