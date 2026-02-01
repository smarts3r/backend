import { CategoryService, CreateCategoryData, UpdateCategoryData } from "./category.service";
import { CacheService } from "./cache.service";
import { logger } from "../utils/logger";

export class CachedCategoryService {
  private categoryService: CategoryService;
  private cache: CacheService;

  constructor() {
    this.categoryService = new CategoryService();
    this.cache = new CacheService('./cache_categories.db'); // Separate cache DB for categories
  }

  async getAllCategories() {
    const cacheKey = 'categories:all';

    // Try to get from cache first
    let result = await this.cache.get(cacheKey);

    if (result) {
      logger.info(`Cache hit for ${cacheKey}`);
      return result;
    }

    logger.info(`Cache miss for ${cacheKey}, fetching from database`);

    // If not in cache, get from the original service
    result = await this.categoryService.getAllCategories();

    // Store in cache with TTL of 30 minutes (categories rarely change)
    await this.cache.set(cacheKey, result, 30 * 60); // 30 minutes in seconds

    return result;
  }

  async createCategory(categoryData: CreateCategoryData) {
    // Clear relevant cache entries when creating a new category
    await this.clearCategoryCache();

    // Call the original service
    const result = await this.categoryService.createCategory(categoryData);

    return result;
  }

  async updateCategory(id: number, categoryData: UpdateCategoryData) {
    // Clear relevant cache entries when updating a category
    await this.clearCategoryCache();
    await this.cache.delete(`category:${id}`); // Also clear specific category cache

    // Call the original service
    const result = await this.categoryService.updateCategory(id, categoryData);

    return result;
  }

  async deleteCategory(id: number) {
    // Clear relevant cache entries when deleting a category
    await this.clearCategoryCache();
    await this.cache.delete(`category:${id}`); // Also clear specific category cache

    // Call the original service
    const result = await this.categoryService.deleteCategory(id);

    return result;
  }

  private async clearCategoryCache() {
    // Clear all category caches
    await this.cache.clear();
  }
}