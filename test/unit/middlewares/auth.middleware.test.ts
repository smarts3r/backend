import { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';

// Mock external dependencies FIRST before importing anything that uses them
jest.mock('@/src/lib/prisma', () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
    },
  };

  return {
    __esModule: true,
    default: mockPrisma,
  };
});

jest.mock('../../../src/services/sessionCache');
jest.mock('../../../src/utils/authUtilities');

// Now import modules that depend on the mocks
import { authenticateToken, authorizeRoles } from '../../../src/middlewares/authMiddleware';
import { getSession, setSession } from '../../../src/services/sessionCache';
import * as authUtils from '../../../src/utils/authUtilities';
import prisma from '@/src/lib/prisma';

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      cookies: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should call next if token is valid and user is in session', async () => {
      const mockToken = 'valid-token';
      const mockUserData = { id: '1', role: 'USER' };
      const mockUser = { id: 1, email: 'test@example.com', role: 'USER' };

      mockRequest.headers = { authorization: `Bearer ${mockToken}` };
      (authUtils.verifyToken as jest.Mock).mockReturnValue(mockUserData);
      (getSession as jest.Mock).mockReturnValue(mockUser);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(authUtils.verifyToken).toHaveBeenCalledWith(mockToken, authUtils.ACCESS_TOKEN_SECRET);
      expect(getSession).toHaveBeenCalledWith('1');
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next if token is valid and user is fetched from DB', async () => {
      const mockToken = 'valid-token';
      const mockUserData = { id: '1', role: 'USER' };
      const mockDbUser = {
        id: 1,
        email: 'test@example.com',
        role: 'USER',
        username: 'testuser',
        created_at: new Date(),
        updated_at: new Date()
      };
      const mockUser = {
        id: 1,
        email: 'test@example.com',
        role: 'USER',
        name: 'testuser',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.headers = { authorization: `Bearer ${mockToken}` };
      (authUtils.verifyToken as jest.Mock).mockReturnValue(mockUserData);
      (getSession as jest.Mock).mockReturnValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
      (setSession as jest.Mock).mockReturnValue(undefined);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(authUtils.verifyToken).toHaveBeenCalledWith(mockToken, authUtils.ACCESS_TOKEN_SECRET);
      expect(getSession).toHaveBeenCalledWith('1');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(setSession).toHaveBeenCalledWith('1', expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        name: mockUser.name,
      }));
      expect(mockRequest.user).toEqual(expect.objectContaining({
        id: mockUser.id,
        email: mockUser.email,
        role: mockUser.role,
        name: mockUser.name,
      }));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 if no token is provided in header or cookies', async () => {
      mockRequest.headers = {};
      mockRequest.cookies = {};

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Access Token Required',
      });
    });

    it('should return 403 if token is invalid', async () => {
      const mockToken = 'invalid-token';

      mockRequest.headers = { authorization: `Bearer ${mockToken}` };
      (authUtils.verifyToken as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid Token');
      });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Invalid Token',
      });
    });

    it('should return 403 if user is not found in DB', async () => {
      const mockToken = 'valid-token';
      const mockUserData = { id: '1', role: 'USER' };

      mockRequest.headers = { authorization: `Bearer ${mockToken}` };
      (authUtils.verifyToken as jest.Mock).mockReturnValue(mockUserData);
      (getSession as jest.Mock).mockReturnValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'User Not Found',
      });
    });
  });

  describe('authorizeRoles', () => {
    it('should call next if user has required role', () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'ADMIN' };
      mockRequest.user = mockUser;

      const middleware = authorizeRoles('ADMIN');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 if user does not have required role', () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'USER' };
      mockRequest.user = mockUser;

      const middleware = authorizeRoles('ADMIN');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Access Denied: Insufficient Permissions',
      });
    });

    it('should allow access if user has one of multiple required roles', () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'MODERATOR' };
      mockRequest.user = mockUser;

      const middleware = authorizeRoles('ADMIN', 'MODERATOR');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 if user does not have any of the required roles', () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'USER' };
      mockRequest.user = mockUser;

      const middleware = authorizeRoles('ADMIN', 'MODERATOR');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Access Denied: Insufficient Permissions',
      });
    });

    it('should return 403 if no user is attached to request', () => {
      mockRequest.user = undefined;

      const middleware = authorizeRoles('ADMIN');
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Access Denied: Insufficient Permissions',
      });
    });
  });
});