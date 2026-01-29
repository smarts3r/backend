import { Request, Response } from 'express';
import { jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';

// Mock the AuthService before importing the controller
const mockAuthService = {
  registerUser: jest.fn(),
  loginUser: jest.fn(),
  refreshUserToken: jest.fn(),
  logoutUser: jest.fn(),
};

jest.mock('../../../src/services/auth.service', () => {
  return {
    AuthService: jest.fn(() => mockAuthService),
  };
});

import { register, login, logout, refresh, forgetPassword } from '../../../src/controllers/auth.controller';

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const mockUserData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResult = {
        success: true,
        message: 'User registered successfully',
        userId: 1,
      };

      mockRequest.body = mockUserData;
      mockAuthService.registerUser.mockResolvedValue(mockResult);

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.registerUser).toHaveBeenCalledWith(mockUserData);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
    });

    it('should handle registration errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockUserData = {
        email: 'test@example.com',
        password: 'password123',
      };

      mockRequest.body = mockUserData;
      mockAuthService.registerUser.mockRejectedValue(new Error('User already exists'));

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: 'User already exists',
      });
      expect(consoleSpy).toHaveBeenCalledWith('Register error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockCredentials = {
        loginIdentifier: 'test@example.com',
        password: 'password123',
      };

      const mockResult = {
        user: {
          id: 1,
          email: 'test@example.com',
          role: 'USER',
        },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      mockRequest.body = mockCredentials;
      mockAuthService.loginUser.mockResolvedValue(mockResult);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.loginUser).toHaveBeenCalledWith(mockCredentials);
      expect(mockResponse.cookie).toHaveBeenCalledWith('accessToken', 'access-token', expect.any(Object));
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token', expect.any(Object));
      expect(mockResponse.json).toHaveBeenCalledWith({
        user: mockResult.user,
        accessToken: mockResult.accessToken,
      });
    });

    it('should return 401 for invalid credentials', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const mockCredentials = {
        loginIdentifier: 'test@example.com',
        password: 'wrongpassword',
      };

      mockRequest.body = mockCredentials;
      mockAuthService.loginUser.mockRejectedValue(new Error('Invalid credentials'));

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid credentials',
      });
      expect(consoleSpy).toHaveBeenCalledWith('Login error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      (mockRequest as any).user = { id: 1 };

      await logout(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.logoutUser).toHaveBeenCalledWith(1);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken');
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });

  describe('refresh', () => {
    it('should refresh access token', async () => {
      const mockRefreshToken = 'refresh-token';
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockRequest.cookies = { refreshToken: mockRefreshToken };
      mockAuthService.refreshUserToken.mockResolvedValue(mockResult);

      await refresh(mockRequest as Request, mockResponse as Response);

      expect(mockAuthService.refreshUserToken).toHaveBeenCalledWith(mockRefreshToken);
      expect(mockResponse.cookie).toHaveBeenCalledWith('accessToken', 'new-access-token', expect.any(Object));
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'new-refresh-token', expect.any(Object));
      expect(mockResponse.json).toHaveBeenCalledWith({ accessToken: 'new-access-token' });
    });

    it('should return 403 if refresh token is invalid', async () => {
      const mockRefreshToken = 'invalid-token';

      mockRequest.cookies = { refreshToken: mockRefreshToken };
      mockAuthService.refreshUserToken.mockRejectedValue(new Error('Invalid refresh token'));

      await refresh(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid or expired refresh token',
      });
    });
  });

  describe('forgetPassword', () => {
    it('should return a message for password reset functionality', async () => {
      await forgetPassword(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Password reset functionality not implemented' });
    });
  });
});