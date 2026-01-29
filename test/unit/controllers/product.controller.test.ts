import { Request, Response } from 'express';
import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Mock the ProductService before importing the controller
const mockProductService = {
  getAllProducts: jest.fn(),
  getProductById: jest.fn(),
  createProduct: jest.fn(),
  updateProduct: jest.fn(),
  deleteProduct: jest.fn(),
};

jest.mock('../../../src/services/product.service', () => {
  return {
    ProductService: jest.fn(() => mockProductService),
  };
});

import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
} from '../../../src/controllers/product.controller';

describe('Product Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
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

      mockProductService.getAllProducts.mockResolvedValue(mockProducts);

      await getAllProducts(mockRequest as Request, mockResponse as Response);

      expect(mockProductService.getAllProducts).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(mockProducts);
    });

    it('should handle errors when getting products', async () => {
      mockProductService.getAllProducts.mockRejectedValue(new Error('Database error'));

      await getAllProducts(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Database error',
      });
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

      mockRequest.params = { id: '1' };
      mockProductService.getProductById.mockResolvedValue(mockProduct);

      await getProductById(mockRequest as Request, mockResponse as Response);

      expect(mockProductService.getProductById).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockProduct);
    });

    it('should return 404 if product not found', async () => {
      mockRequest.params = { id: '999' };
      mockProductService.getProductById.mockRejectedValue(new Error('Product not found'));

      await getProductById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Product not found',
      });
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

      const mockResult = {
        id: 1,
        name: 'New Product',
        message: 'Product created successfully',
      };

      mockRequest.body = mockProductData;
      mockProductService.createProduct.mockResolvedValue(mockResult);

      await createProduct(mockRequest as Request, mockResponse as Response);

      expect(mockProductService.createProduct).toHaveBeenCalledWith(mockProductData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle errors when creating product', async () => {
      const mockProductData = {
        name: 'New Product',
        price: 100,
        category_id: 1,
        img: 'new-product.jpg',
      };

      mockRequest.body = mockProductData;
      mockProductService.createProduct.mockRejectedValue(new Error('Creation failed'));

      await createProduct(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Creation failed',
      });
    });
  });

  describe('updateProduct', () => {
    it('should update a product', async () => {
      const mockProductData = {
        name: 'Updated Product',
        price: 150,
      };

      const mockResult = {
        id: 1,
        name: 'Updated Product',
        message: 'Product updated successfully',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = mockProductData;
      mockProductService.updateProduct.mockResolvedValue(mockResult);

      await updateProduct(mockRequest as Request, mockResponse as Response);

      expect(mockProductService.updateProduct).toHaveBeenCalledWith(1, mockProductData);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle errors when updating product', async () => {
      const mockProductData = {
        name: 'Updated Product',
      };

      mockRequest.params = { id: '1' };
      mockRequest.body = mockProductData;
      mockProductService.updateProduct.mockRejectedValue(new Error('Update failed'));

      await updateProduct(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Update failed',
      });
    });
  });

  describe('deleteProduct', () => {
    it('should delete a product', async () => {
      mockRequest.params = { id: '1' };
      const mockResult = { id: 1, message: 'Product deleted successfully' };
      mockProductService.deleteProduct.mockResolvedValue(mockResult);

      await deleteProduct(mockRequest as Request, mockResponse as Response);

      expect(mockProductService.deleteProduct).toHaveBeenCalledWith(1);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle errors when deleting product', async () => {
      mockRequest.params = { id: '1' };
      mockProductService.deleteProduct.mockRejectedValue(new Error('Delete failed'));

      await deleteProduct(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Delete failed',
      });
    });
  });
});