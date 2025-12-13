import request from 'supertest';
import express from 'express';

import customerModel from '../models/customerModel.js';
import productModel from '../models/productModel.js';

jest.mock('../middlewares/authMiddleware.js', () => (req, res, next) => {
  req.user = { id: 'user1' };
  next();
});

import wishlistRouter from '../routes/home/wishlistRoutes.js';

const app = express();
app.use(express.json());
app.use('/api', wishlistRouter);

afterEach(() => {
  jest.clearAllMocks();
});

describe('Wishlist API', () => {
  describe('POST /api/add-to-wishlist', () => {
    test('adds a product to wishlist', async () => {
      const productId = '507f1f77bcf86cd799439011';
      productModel.findById = jest.fn().mockResolvedValue({
        _id: productId,
        name: 'Test Product',
        price: 100,
        images: ['img.jpg']
      });
      customerModel.findById = jest.fn().mockResolvedValue({
        wishlist: [],
        save: jest.fn().mockResolvedValue({})
      });

      const res = await request(app)
        .post('/api/add-to-wishlist')
        .send({ productId });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Added to wishlist');
    });

    test('returns 400 if product already in wishlist', async () => {
      const productId = '507f1f77bcf86cd799439011';
      productModel.findById = jest.fn().mockResolvedValue({
        _id: productId,
        name: 'Test Product',
        price: 100,
        images: ['img.jpg']
      });
      customerModel.findById = jest.fn().mockResolvedValue({
        wishlist: [{
          productId: { equals: (id) => id === productId },
          color: '',
          size: ''
        }],
        save: jest.fn()
      });

      const res = await request(app)
        .post('/api/add-to-wishlist')
        .send({ productId });

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('Already in wishlist');
    });

    test('returns 404 if product not found', async () => {
      productModel.findById = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .post('/api/add-to-wishlist')
        .send({ productId: '507f1f77bcf86cd799439011' });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('Product Not Found');
    });
  });

  describe('POST /api/remove-from-wishlist', () => {
    test('removes product from wishlist', async () => {
      const productId = '507f1f77bcf86cd799439011';
      const save = jest.fn().mockResolvedValue({});
      customerModel.findById = jest.fn().mockResolvedValue({
        wishlist: [{
          productId: { equals: (id) => id === productId },
          color: '',
          size: ''
        }],
        save
      });

      const res = await request(app)
        .post('/api/remove-from-wishlist')
        .send({ productId });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Removed from wishlist');
      expect(save).toHaveBeenCalled();
    });

    test('returns 404 when user not found', async () => {
      customerModel.findById = jest.fn().mockResolvedValue(null);

      const res = await request(app)
        .post('/api/remove-from-wishlist')
        .send({ productId: '507f1f77bcf86cd799439011' });

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });

  describe('GET /api/wishlist', () => {
    test('returns wishlist items', async () => {
      customerModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ wishlist: ['a', 'b'] })
      });

      const res = await request(app).get('/api/wishlist');

      expect(res.statusCode).toBe(200);
      expect(res.body.wishlist).toEqual(['a', 'b']);
    });

    test('returns 404 when user not found', async () => {
      customerModel.findById = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app).get('/api/wishlist');

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('User not found');
    });
  });
});
