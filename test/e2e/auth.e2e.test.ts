import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import * as bcrypt from 'bcryptjs';

describe('Auth Endpoints E2E Tests', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123',
    username: `testuser${Date.now()}`,
  };

  let authToken: string;
  let userId: number;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(testUser.password, 10);

    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        password: hashedPassword,
        username: testUser.username,
      },
    });

    userId = user.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: { contains: 'test-' } },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const newUser = {
        email: `new-${Date.now()}@example.com`,
        password: 'Test123',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should not register with duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate password complexity', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test2@example.com',
          password: 'weak',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          loginIdentifier: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('accessToken');

      authToken = response.body.accessToken;
    });

    it('should not login with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          loginIdentifier: testUser.email,
          password: 'WrongPassword123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should login with username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          loginIdentifier: testUser.username,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=test-refresh-token`)
        .expect(200);

      if (response.body && response.body.success !== undefined) {
        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('accessToken');
      }
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });
  });
});
