import { prisma } from "../lib/prisma";
import { logger } from "../utils/logger";

export interface CreateProductData {
  name: string;
  price: number;
  old_price?: number;
  category_id: number;
  img: string;
  stock?: number;
  description?: string;
}

export interface UpdateProductData {
  name?: string;
  price?: number;
  old_price?: number;
  category_id?: number;
  img?: string;
  stock?: number;
  description?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ProductService {
  async getAllProducts(page: number = 1, limit: number = 10, sortBy: string = 'id', sortOrder: 'asc' | 'desc' = 'asc'): Promise<PaginatedResult<any>> {
    try {
      const offset = (page - 1) * limit;

      const total = await prisma.product.count();

      const products = await prisma.product.findMany({
        skip: offset,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
      });

      return {
        data: products,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Error fetching products:", error);
      throw new Error("Error fetching products");
    }
  }

  async getProductById(id: number) {
    try {
      const product = await prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        logger.warn(`Product not found with ID: ${id}`);
        throw new Error("Product not found");
      }

      return product;
    } catch (error) {
      logger.error("Error fetching product:", error);
      throw error instanceof Error
        ? error
        : new Error("Error fetching product");
    }
  }

  async createProduct(productData: CreateProductData) {
    try {
      const { name, price, old_price, category_id, img, stock, description } =
        productData;

      const product = await prisma.product.create({
        data: {
          name,
          price,
          old_price: old_price ?? null,
          category_id,
          img,
          stock: stock ?? 10,
          description: description ?? name,
        },
      });

      logger.info(`Product created successfully with ID: ${product.id}`);

      return {
        id: product.id,
        name: product.name,
        message: "Product created successfully",
      };
    } catch (error) {
      logger.error("Error creating product:", error);
      throw new Error("Error creating product");
    }
  }

  async updateProduct(id: number, productData: UpdateProductData) {
    try {
      const { name, price, old_price, category_id, img, stock, description } =
        productData;

      const product = await prisma.product.update({
        where: { id },
        data: {
          name,
          price,
          old_price: old_price ?? null,
          category_id,
          img,
          stock: stock ?? 10,
          description: description ?? name,
        },
      });

      logger.info(`Product updated successfully with ID: ${product.id}`);

      return {
        id: product.id,
        name: product.name,
        message: "Product updated successfully",
      };
    } catch (error) {
      logger.error("Error updating product:", error);
      throw new Error("Error updating product");
    }
  }

  async deleteProduct(id: number) {
    try {
      await prisma.product.delete({
        where: { id },
      });

      logger.info(`Product deleted successfully with ID: ${id}`);

      return { id, message: "Product deleted successfully" };
    } catch (error) {
      logger.error("Error deleting product:", error);
      throw new Error("Error deleting product");
    }
  }
}
