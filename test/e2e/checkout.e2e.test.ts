import request from 'supertest';
import app from '../../src/app';
import { prisma } from '../../src/lib/prisma';
import * as bcrypt from 'bcryptjs';

describe('Order and Payment Endpoints E2E Tests', () => {
  let userToken: string;
  let userId: number;
  let categoryId: number;
  let productId: number;
  let orderNumber: string;

  const testUser = {
    email: `order-test-${Date.now()}@example.com`,
    password: 'Order123',
    username: `ordertest${Date.now()}`,
  };

  beforeAll(async () => {
    const category = await prisma.category.create({
      data: { name: 'Test Category' },
    });
    categoryId = category.id;

    const product = await prisma.product.create({
      data: {
        name: 'Test Product',
        price: 100,
        category_id: categoryId,
        img: 'https://example.com/image.jpg',
        stock: 50,
      },
    });
    productId = product.id;

    const hashedPassword = await bcrypt.hash(testUser.password, 10);

    const user = await prisma.user.create({
      data: {
        email: testUser.email,
        password: hashedPassword,
        username: testUser.username,
      },
    });

    userId = user.id;

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        loginIdentifier: testUser.email,
        password: testUser.password,
      });

    userToken = loginResponse.body.accessToken;
  });

  afterAll(async () => {
    await prisma.cart.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: 'order-test-' } },
    });
    await prisma.$disconnect();
  });

  describe('Cart Operations', () => {
    it('should add item to cart', async () => {
      const response = await request(app)
        .post('/api/checkout/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          product_id: productId,
          quantity: 2,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });

    it('should get cart', async () => {
      const response = await request(app)
        .get('/api/checkout/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should update cart item quantity', async () => {
      const getCartResponse = await request(app)
        .get('/api/checkout/cart')
        .set('Authorization', `Bearer ${userToken}`);

      const cartItemId = getCartResponse.body.data[0].id;

      const response = await request(app)
        .put(`/api/checkout/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 3 })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    it('should get cart count', async () => {
      const response = await request(app)
        .get('/api/checkout/cart/count')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('count');
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('should remove item from cart', async () => {
      const getCartResponse = await request(app)
        .get('/api/checkout/cart')
        .set('Authorization', `Bearer ${userToken}`);

      const cartItemId = getCartResponse.body.data[0].id;

      const response = await request(app)
        .delete(`/api/checkout/cart/${cartItemId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Order Creation', () => {
    beforeAll(async () => {
      await request(app)
        .post('/api/checkout/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          product_id: productId,
          quantity: 2,
        });
    });

    it('should create order from cart', async () => {
      const response = await request(app)
        .post('/api/checkout/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shipping_address: '123 Main St, City',
          billing_address: '123 Main St, City',
          payment_method: 'card',
          notes: 'Please deliver between 9am-5pm',
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('order_number');
      expect(response.body.data.status).toBe('PENDING');
      expect(response.body.data.payment_status).toBe('pending');

      orderNumber = response.body.data.order_number;
    });

    it('should get user orders', async () => {
      const response = await request(app)
        .get('/api/checkout/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should reject order creation for empty cart', async () => {
      const response = await request(app)
        .post('/api/checkout/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shipping_address: '123 Main St',
          billing_address: '123 Main St',
          payment_method: 'card',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject unauthenticated order creation', async () => {
      const response = await request(app)
        .post('/api/checkout/orders')
        .send({
          shipping_address: '123 Main St',
          billing_address: '123 Main St',
          payment_method: 'card',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Access Token Required');
    });
  });

  describe('Payment Processing', () => {
    it('should process payment successfully', async () => {
      const response = await request(app)
        .post('/api/checkout/payments/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderNumber,
          payment_method: 'card',
          cardNumber: '4242424242424242',
          expiryDate: '12/25',
          cvv: '123',
          forceSuccess: true,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Payment successful');
    });

    it('should validate payment details', async () => {
      const response = await request(app)
        .post('/api/checkout/payments/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderNumber,
          payment_method: 'card',
          cardNumber: 'invalid',
          expiryDate: 'invalid',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
    });

    it('should process payment with failure simulation', async () => {
      const product2 = await prisma.product.create({
        data: {
          name: 'Product 2',
          price: 50,
          category_id: categoryId,
          img: 'https://example.com/image2.jpg',
          stock: 10,
        },
      });

      await request(app)
        .post('/api/checkout/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          product_id: product2.id,
          quantity: 1,
        });

      const newOrderResponse = await request(app)
        .post('/api/checkout/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shipping_address: '123 Main St',
          billing_address: '123 Main St',
          payment_method: 'card',
        });

      const failedPaymentResponse = await request(app)
        .post('/api/checkout/payments/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderNumber: newOrderResponse.body.data.order_number,
          payment_method: 'card',
          cardNumber: '4111111111111111',
          expiryDate: '12/25',
          cvv: '123',
        });

      expect(failedPaymentResponse.status).toBe(400);
      expect(failedPaymentResponse.body).toHaveProperty('success', false);
    });

    it('should reject payment without authentication', async () => {
      const response = await request(app)
        .post('/api/checkout/payments/checkout')
        .send({
          orderNumber,
          payment_method: 'card',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Access Token Required');
    });
  });

  describe('Order Management', () => {
    it('should get order by ID', async () => {
      const getOrdersResponse = await request(app)
        .get('/api/checkout/orders')
        .set('Authorization', `Bearer ${userToken}`);

      const orderId = getOrdersResponse.body.data[0].id;

      const response = await request(app)
        .get(`/api/checkout/orders/${orderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('orderItems');
    });

    it('should cancel order', async () => {
      const product3 = await prisma.product.create({
        data: {
          name: 'Product 3',
          price: 30,
          category_id: categoryId,
          img: 'https://example.com/image3.jpg',
          stock: 10,
        },
      });

      await request(app)
        .post('/api/checkout/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          product_id: product3.id,
          quantity: 1,
        });

      const orderResponse = await request(app)
        .post('/api/checkout/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shipping_address: '123 Main St',
          billing_address: '123 Main St',
          payment_method: 'card',
        });

      const cancelResponse = await request(app)
        .post(`/api/checkout/orders/${orderResponse.body.data.order_number}/cancel`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(cancelResponse.body).toHaveProperty('success', true);
      expect(cancelResponse.body.data.status).toBe('CANCELLED');
    });

    it('should not cancel delivered or cancelled order', async () => {
      const product4 = await prisma.product.create({
        data: {
          name: 'Product 4',
          price: 25,
          category_id: categoryId,
          img: 'https://example.com/image4.jpg',
          stock: 10,
        },
      });

      await request(app)
        .post('/api/checkout/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          product_id: product4.id,
          quantity: 1,
        });

      const newOrderResponse = await request(app)
        .post('/api/checkout/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shipping_address: '123 Main St',
          billing_address: '123 Main St',
          payment_method: 'card',
        });

      await request(app)
        .post('/api/checkout/payments/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderNumber: newOrderResponse.body.data.order_number,
          payment_method: 'card',
          cardNumber: '4242424242424242',
          expiryDate: '12/25',
          cvv: '123',
          forceSuccess: true,
        });

      await prisma.order.update({
        where: { order_number: newOrderResponse.body.data.order_number },
        data: { status: 'DELIVERED' },
      });

      const cancelResponse = await request(app)
        .post(`/api/checkout/orders/${newOrderResponse.body.data.order_number}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(cancelResponse.status).toBe(400);
      expect(cancelResponse.body).toHaveProperty('success', false);
    });
  });

  describe('Stock Management', () => {
    it('should reduce product stock after successful payment', async () => {
      const product5 = await prisma.product.create({
        data: {
          name: 'Product 5',
          price: 20,
          category_id: categoryId,
          img: 'https://example.com/image5.jpg',
          stock: 100,
        },
      });

      const initialStock = product5.stock;

      await request(app)
        .post('/api/checkout/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          product_id: product5.id,
          quantity: 5,
        });

      const newOrderResponse = await request(app)
        .post('/api/checkout/orders')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          shipping_address: '123 Main St',
          billing_address: '123 Main St',
          payment_method: 'card',
        });

      await request(app)
        .post('/api/checkout/payments/checkout')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          orderNumber: newOrderResponse.body.data.order_number,
          payment_method: 'card',
          cardNumber: '4242424242424242',
          expiryDate: '12/25',
          cvv: '123',
          forceSuccess: true,
        });

      const updatedProduct = await prisma.product.findUnique({
        where: { id: product5.id },
      });

      expect(updatedProduct?.stock).toBe(initialStock - 5);
    });

    it('should not allow order when stock is insufficient', async () => {
      const product6 = await prisma.product.create({
        data: {
          name: 'Product 6',
          price: 15,
          category_id: categoryId,
          img: 'https://example.com/image6.jpg',
          stock: 2,
        },
      });

      const response = await request(app)
        .post('/api/checkout/cart')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          product_id: product6.id,
          quantity: 5,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('success', false);
    });
  });
});
