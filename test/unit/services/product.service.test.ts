import { jest } from '@jest/globals';
import { ProductService } from '../../../src/services/product.service';
import { prisma } from '../../../src/lib/prisma';

// Mock external dependencies
jest.mock('../../../src/lib/prisma', () => {
  return {
    prisma: {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    },
  };
});

describe('ProductService', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
    jest.clearAllMocks();
  });

  describe('getAllProducts', () => {
    it('should return all products', async () => {
      const mockProducts = [
        {
          id: 1,
          name: 'Test Product',
          price: 100,
          category_id: 1,
          img: 'test.jpg',
        }
      ];

      (prisma.product.findMany as jest.Mock).mockResolvedValue(mockProducts);

      const result = await productService.getAllProducts();

      expect(prisma.product.findMany).toHaveBeenCalled();
      expect(result).toEqual(mockProducts);
    });

    it('should throw an error if database query fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.product.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(productService.getAllProducts()).rejects.toThrow('Error fetching products');

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching products:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('getProductById', () => {
    it('should return a product by ID', async () => {
      const mockProduct = {
        id: 1,
        name: 'Test Product',
        price: 100,
        category_id: 1,
        img: 'test.jpg',
      };

      (prisma.product.findUnique as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productService.getProductById(1);

      expect(prisma.product.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(mockProduct);
    });

    it('should throw an error if product not found', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.product.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(productService.getProductById(999)).rejects.toThrow('Product not found');

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching product:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should throw an error if database query fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.product.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(productService.getProductById(1)).rejects.toThrow('Database error');

      expect(consoleSpy).toHaveBeenCalledWith('Error fetching product:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('createProduct', () => {
    it('should create a new product', async () => {
      const mockProductData = {
        name: 'New Product',
        price: 100,
        category_id: 1,
        img: 'new-product.jpg',
      };

      const mockCreatedProduct = {
        id: 1,
        name: 'New Product',
        price: 100,
        category_id: 1,
        img: 'new-product.jpg',
        stock: 10,
        description: 'New Product',
      };

      (prisma.product.create as jest.Mock).mockResolvedValue(mockCreatedProduct);

      const result = await productService.createProduct(mockProductData);

      expect(prisma.product.create).toHaveBeenCalledWith({
        data: {
          name: 'New Product',
          price: 100,
          category_id: 1,
          img: 'new-product.jpg',
          stock: 10,
          description: 'New Product',
          old_price: null,
        },
      });
      expect(result).toEqual({
        id: 1,
        name: 'New Product',
        message: 'Product created successfully',
      });
    });

    it('should throw an error if database query fails', async () => {
      const mockProductData = {
        name: 'New Product',
        price: 100,
        category_id: 1,
        img: 'new-product.jpg',
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.product.create as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(productService.createProduct(mockProductData)).rejects.toThrow('Error creating product');

      expect(consoleSpy).toHaveBeenCalledWith('Error creating product:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const mockProductData = {
        name: 'Updated Product',
        price: 150,
      };

      const mockUpdatedProduct = {
        id: 1,
        name: 'Updated Product',
        price: 150,
        category_id: 1,
        img: 'test.jpg',
        stock: 10,
        description: 'Updated Product',
      };

      (prisma.product.update as jest.Mock).mockResolvedValue(mockUpdatedProduct);

      const result = await productService.updateProduct(1, mockProductData);

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          name: 'Updated Product',
          price: 150,
          category_id: undefined,
          img: undefined,
          stock: 10,
          description: 'Updated Product',
          old_price: null,
        },
      });
      expect(result).toEqual({
        id: 1,
        name: 'Updated Product',
        message: 'Product updated successfully',
      });
    });

    it('should throw an error if database query fails', async () => {
      const mockProductData = {
        name: 'Updated Product',
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.product.update as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(productService.updateProduct(1, mockProductData)).rejects.toThrow('Error updating product');

      expect(consoleSpy).toHaveBeenCalledWith('Error updating product:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      (prisma.product.delete as jest.Mock).mockResolvedValue({});

      const result = await productService.deleteProduct(1);

      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual({ id: 1, message: 'Product deleted successfully' });
    });

    it('should throw an error if database query fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (prisma.product.delete as jest.Mock).mockRejectedValue(new Error('Database error'));

      await expect(productService.deleteProduct(1)).rejects.toThrow('Error deleting product');

      expect(consoleSpy).toHaveBeenCalledWith('Error deleting product:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });
});