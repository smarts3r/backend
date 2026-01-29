import { jest } from '@jest/globals';
import { Role } from '@prisma/client';
import { AuthService } from '../../../src/services/auth.service';
import { prisma } from '../../../src/lib/prisma';
import * as authUtils from '../../../src/utils/authUtilities';
import { setSession } from '../../../src/services/sessionCache';

// Mock external dependencies
jest.mock('../../../src/lib/prisma', () => {
  return {
    prisma: {
      user: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    },
  };
});
jest.mock('../../../src/utils/authUtilities');
jest.mock('../../../src/services/sessionCache');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      const mockUserData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockHashedPassword = 'hashedPassword';
      const mockCreatedUser = { id: 1 };

      (authUtils.normalize as jest.Mock).mockReturnValue('test@example.com');
      (authUtils.hashPassword as jest.Mock).mockResolvedValue(mockHashedPassword);
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockCreatedUser);

      const result = await authService.registerUser(mockUserData);

      expect(authUtils.normalize).toHaveBeenCalledWith('test@example.com');
      expect(authUtils.hashPassword).toHaveBeenCalledWith('password123');
      expect(prisma.user.findFirst).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          username: null,
          email: 'test@example.com',
          password: mockHashedPassword,
          role: Role.USER,
        },
        select: { id: true },
      });
      expect(result).toEqual({
        success: true,
        message: 'User registered successfully',
        userId: 1,
      });
    });

    it('should throw an error if email and password are not provided', async () => {
      const mockUserData = {
        email: '',
        password: '',
      };

      await expect(authService.registerUser(mockUserData)).rejects.toThrow('Email and password are required');
    });

    it('should throw an error if user already exists', async () => {
      const mockUserData = {
        email: 'test@example.com',
        password: 'password123',
      };

      (authUtils.normalize as jest.Mock).mockReturnValue('test@example.com');
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({ id: 1 });

      await expect(authService.registerUser(mockUserData)).rejects.toThrow('User already exists');
    });
  });

  describe('loginUser', () => {
    it('should login user successfully', async () => {
      const mockCredentials = {
        loginIdentifier: 'test@example.com',
        password: 'password123',
      };

      const mockDbUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        password: 'hashedPassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockPublicUser = {
        id: 1,
        email: 'test@example.com',
        role: 'USER',
        name: 'testuser',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockAccessToken = 'access-token';
      const mockRefreshToken = 'refresh-token';

      (authUtils.isEmail as jest.Mock).mockReturnValue(true);
      (authUtils.normalize as jest.Mock).mockReturnValue('test@example.com');
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockDbUser);
      (authUtils.comparePassword as jest.Mock).mockResolvedValue(true);
      (authUtils.generateAccessToken as jest.Mock).mockReturnValue(mockAccessToken);
      (authUtils.generateRefreshToken as jest.Mock).mockReturnValue(mockRefreshToken);
      (setSession as jest.Mock).mockReturnValue(undefined);

      const result = await authService.loginUser(mockCredentials);

      expect(authUtils.isEmail).toHaveBeenCalledWith('test@example.com');
      expect(authUtils.normalize).toHaveBeenCalledWith('test@example.com');
      expect(prisma.user.findFirst).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          password: true,
          created_at: true,
          updated_at: true,
        },
      });
      expect(authUtils.comparePassword).toHaveBeenCalledWith('password123', 'hashedPassword');
      expect(authUtils.generateAccessToken).toHaveBeenCalledWith(mockPublicUser);
      expect(authUtils.generateRefreshToken).toHaveBeenCalledWith(mockPublicUser);
      expect(setSession).toHaveBeenCalledWith('1', mockPublicUser);
      expect(result).toEqual({
        user: mockPublicUser,
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
      });
    });

    it('should throw an error if credentials are invalid', async () => {
      const mockCredentials = {
        loginIdentifier: 'test@example.com',
        password: 'wrongpassword',
      };

      const mockDbUser = {
        id: 1,
        email: 'test@example.com',
        username: 'testuser',
        role: 'USER',
        password: 'hashedPassword',
        created_at: new Date(),
        updated_at: new Date(),
      };

      (authUtils.isEmail as jest.Mock).mockReturnValue(true);
      (authUtils.normalize as jest.Mock).mockReturnValue('test@example.com');
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(mockDbUser);
      (authUtils.comparePassword as jest.Mock).mockResolvedValue(false);

      await expect(authService.loginUser(mockCredentials)).rejects.toThrow('Invalid credentials');
    });

    it('should throw an error if user is not found', async () => {
      const mockCredentials = {
        loginIdentifier: 'test@example.com',
        password: 'password123',
      };

      (authUtils.isEmail as jest.Mock).mockReturnValue(true);
      (authUtils.normalize as jest.Mock).mockReturnValue('test@example.com');
      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);

      await expect(authService.loginUser(mockCredentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('refreshUserToken', () => {
    it('should refresh user token successfully', async () => {
      const mockRefreshToken = 'refresh-token';
      const mockUserData = { id: '1', role: 'USER' };
      const mockNewAccessToken = 'new-access-token';
      const mockNewRefreshToken = 'new-refresh-token';

      (authUtils.verifyToken as jest.Mock).mockReturnValue(mockUserData);
      (authUtils.generateAccessToken as jest.Mock).mockReturnValue(mockNewAccessToken);
      (authUtils.generateRefreshToken as jest.Mock).mockReturnValue(mockNewRefreshToken);

      const result = await authService.refreshUserToken(mockRefreshToken);

      expect(authUtils.verifyToken).toHaveBeenCalledWith(mockRefreshToken, authUtils.REFRESH_TOKEN_SECRET);
      expect(authUtils.generateAccessToken).toHaveBeenCalledWith(mockUserData);
      expect(authUtils.generateRefreshToken).toHaveBeenCalledWith(mockUserData);
      expect(result).toEqual({
        accessToken: mockNewAccessToken,
        refreshToken: mockNewRefreshToken,
      });
    });

    it('should throw an error if refresh token is not provided', async () => {
      await expect(authService.refreshUserToken('')).rejects.toThrow('Refresh token required');
    });
  });

  describe('logoutUser', () => {
    it('should handle logout when userId is provided', () => {
      const mockUserId = '1';
      // Just call the method to ensure it doesn't throw an error
      expect(() => authService.logoutUser(mockUserId)).not.toThrow();
    });

    it('should handle logout when userId is not provided', () => {
      // Just call the method to ensure it doesn't throw an error
      expect(() => authService.logoutUser()).not.toThrow();
    });
  });
});