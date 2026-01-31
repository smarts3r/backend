import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import * as bcrypt from 'bcryptjs';

describe('Product Endpoints E2E Tests', () => {
  let adminToken: string;
  let testProductId: number;

  const adminUser = {
    email: `admin-${Date.now()}@example.com`,
    password: 'Admin123',
    username: `admin${Date.now()}`,
    role: 'ADMIN',
  };

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash(adminUser.password, 10);

    const user = await prisma.user.create({
      data: {
        email: adminUser.email,
        password: hashedPassword,
        username: adminUser.username,
        role: 'ADMIN',
      },
    });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        loginIdentifier: adminUser.email,
        password: adminUser.password,
      });

    adminToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: 'admin-' } },
    });
    await prisma.$disconnect();
  });

  describe('GET /api/products (Public)', () => {
    it('should return all products', async () => {
      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/products?page=1&limit=5')
        .expect(200);

      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 5);
    });
  });

  describe('GET /api/products/:id (Public)', () => {
    it('should return a single product', async () => {
      const response = await request(app)
        .get('/api/products/1')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .get('/api/products/99999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('POST /api/products (Admin Only)', () => {
    it('should create product with admin token', async () => {
      const category = await prisma.category.create({
        data: {
          name: 'Test Category',
        },
      });

      const productData = {
        name: 'Test Product',
        price: 100,
        category_id: category.id,
        img: 'https://example.com/image.jpg',
        stock: 10,
        description: 'Test description',
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      testProductId = response.body.data?.id || response.body.id;
    });

    it('should reject product creation without authentication', async () => {
      const response = await request(app)
        .post('/api/products')
        .send({
          name: 'Unauthorized Product',
          price: 50,
          category_id: 1,
          img: 'https://example.com/image.jpg',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Access Token Required');
    });

    it('should reject product creation with non-admin token', async () => {
      const normalUser = await prisma.user.create({
        data: {
          email: `user-${Date.now()}@example.com`,
          password: await bcrypt.hash('User123', 10),
          role: 'USER',
        },
      });

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          loginIdentifier: normalUser.email,
          password: 'User123',
        });

      const userToken = loginResponse.body.accessToken;

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Unauthorized Product',
          price: 50,
          category_id: 1,
          img: 'https://example.com/image.jpg',
        })
        .expect(403);

      expect(response.body).toHaveProperty('message', 'Access Denied: Insufficient Permissions');
    });
  });

  describe('PUT /api/products/:id (Admin Only)', () => {
    it('should update product with admin token', async () => {
      const response = await request(app)
        .put(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Test Product',
          price: 150,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should reject update without authentication', async () => {
      const response = await request(app)
        .put(`/api/products/${testProductId}`)
        .send({ name: 'Unauthorized Update' })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Access Token Required');
    });
  });

  describe('DELETE /api/products/:id (Admin Only)', () => {
    it('should delete product with admin token', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should reject delete without authentication', async () => {
      const response = await request(app)
        .delete(`/api/products/${testProductId}`)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Access Token Required');
    });
  });
});
