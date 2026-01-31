import { jest } from '@jest/globals';
import type { Request, Response, NextFunction } from 'express';
import * as authUtils from '../../../src/utils/authUtilities';
import { setSession, getSession } from '../../../src/services/sessionCache';
import prisma from '../../../src/lib/prisma';

import { authenticateToken, authorizeRoles } from '../../../src/middlewares/authMiddleware';

jest.mock('../../../src/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('../../../src/utils/authUtilities', () => ({
  verifyToken: jest.fn(),
  ACCESS_TOKEN_SECRET: 'test-secret',
}));

jest.mock('../../../src/services/sessionCache', () => ({
  getSession: jest.fn(),
  setSession: jest.fn(),
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(),
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request> & { user?: any };
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
      cookies: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should call next if token is valid and user is in session', async () => {
      const mockToken = 'valid-token';
      const mockUserData = { id: '1', email: 'test@example.com', role: 'USER' };

      mockRequest.headers = { authorization: `Bearer ${mockToken}` };

      (getSession as jest.Mock).mockResolvedValue(mockUserData);
      (authUtils.verifyToken as jest.Mock).mockReturnValue({ id: '1', role: 'USER' });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(getSession).toHaveBeenCalledWith('1');
      expect(authUtils.verifyToken).toHaveBeenCalledWith(mockToken, 'test-secret');
      expect(mockRequest.user).toEqual(mockUserData);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should fetch user from DB if not in session', async () => {
      const mockToken = 'valid-token';
      const mockDbUser = { id: '1', email: 'test@example.com', role: 'USER', username: 'testuser', created_at: new Date(), updated_at: new Date() };
      const mockUserData = { id: '1', email: 'test@example.com', role: 'USER', name: 'testuser', createdAt: new Date(), updatedAt: new Date() };

      mockRequest.headers = { authorization: `Bearer ${mockToken}` };

      (getSession as jest.Mock).mockResolvedValue(null);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockDbUser);
      (authUtils.verifyToken as jest.Mock).mockReturnValue({ id: '1', role: 'USER' });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(setSession).toHaveBeenCalledWith('1', mockUserData);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 if token is missing', async () => {
      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Access Token Required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 403 if token is invalid', async () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      (authUtils.verifyToken as jest.Mock).mockImplementation(() => { throw new Error('Invalid Token'); });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Invalid Token' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('authorizeRoles', () => {
    it('should call next if user has allowed role', () => {
      const mockUser = { id: '1', role: 'ADMIN' };
      mockRequest.user = mockUser;

      authorizeRoles('ADMIN')(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 403 if user does not have required role', () => {
      const mockUser = { id: '1', role: 'USER' };
      mockRequest.user = mockUser;

      authorizeRoles('ADMIN')(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Access Denied: Insufficient Permissions' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should work with multiple allowed roles', () => {
      const mockUser = { id: '1', role: 'MODERATOR' };
      mockRequest.user = mockUser;

      authorizeRoles('ADMIN', 'MODERATOR')(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
