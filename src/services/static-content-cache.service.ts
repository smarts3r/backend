import { CacheService } from "./cache.service";
import { logger } from "../utils/logger";

export class StaticContentCache {
  private cache: CacheService;

  constructor() {
    this.cache = new CacheService('./cache_static.db'); // Separate cache DB for static content
  }

  async getStaticContent(key: string) {
    // Try to get from cache first
    let result = await this.cache.get(key);

    if (result) {
      logger.info(`Cache hit for static content: ${key}`);
      return result;
    }

    logger.info(`Cache miss for static content: ${key}, would fetch from source`);

    // In a real implementation, you would fetch from your static content source
    // For now, returning null to indicate cache miss
    return null;
  }

  async setStaticContent(key: string, content: any, ttlSeconds: number = 60 * 60) { // 1 hour default
    await this.cache.set(key, content, ttlSeconds);
    logger.info(`Static content cached: ${key} for ${ttlSeconds} seconds`);
  }

  async updateStaticContent(key: string, content: any, ttlSeconds?: number) {
    await this.cache.set(key, content, ttlSeconds);
    logger.info(`Static content updated in cache: ${key}`);
  }

  async deleteStaticContent(key: string) {
    await this.cache.delete(key);
    logger.info(`Static content removed from cache: ${key}`);
  }

  async clearAllStaticContent() {
    await this.cache.clear();
    logger.info('All static content cache cleared');
  }
}