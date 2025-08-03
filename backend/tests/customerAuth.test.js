import request from 'supertest';
import express from 'express';

// mock dependencies
import customerModel from '../models/customerModel.js';
import bcrypt from 'bcrypt';

let app;

beforeAll(async () => {
  jest.doMock('../utils/tokenCreate.js', () => ({
    __esModule: true,
    default: jest.fn(),
  }));

  jest.doMock('../utils/mail.js', () => ({
    __esModule: true,
    sendMail: jest.fn().mockResolvedValue({ data: 'ok', error: null }),
  }));

  const { default: customerAuthControllerRouter } = await import('../routes/home/customerAuthRoutes.js');

  app = express();
  app.use(express.json());
  app.use('/api', customerAuthControllerRouter);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Customer Authentication', () => {
  describe('POST /api/customer/customer-register', () => {
    test('returns 201 on success', async () => {
      customerModel.findOne = jest.fn().mockResolvedValue(null);
      customerModel.create = jest.fn().mockResolvedValue({
        id: '1',
        name: 'John',
        email: 'john@example.com',
        password: 'hashed',
        method: 'manually',
        role: 'customer'
      });
      bcrypt.hash = jest.fn().mockResolvedValue('hashed');

      const res = await request(app)
        .post('/api/customer/customer-register')
        .send({ name: 'John', email: 'john@example.com', password: 'secret' });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('User Register Success');
    });

    test('returns 404 if email exists', async () => {
      customerModel.findOne = jest.fn().mockResolvedValue({ id: '1' });

      const res = await request(app)
        .post('/api/customer/customer-register')
        .send({ name: 'John', email: 'john@example.com', password: 'secret' });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/customer/customer-login', () => {
    test('returns 201 on success', async () => {
      customerModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          id: '1',
          name: 'John',
          email: 'john@example.com',
          password: 'hashed',
          method: 'manually',
          role: 'customer'
        })
      });
      bcrypt.compare = jest.fn().mockResolvedValue(true);

      const res = await request(app)
        .post('/api/customer/customer-login')
        .send({ email: 'john@example.com', password: 'secret' });

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('User Login Success');
    });

    test('returns 404 on wrong password', async () => {
      customerModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          id: '1',
          password: 'hashed'
        })
      });
      bcrypt.compare = jest.fn().mockResolvedValue(false);

      const res = await request(app)
        .post('/api/customer/customer-login')
        .send({ email: 'john@example.com', password: 'wrong' });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Password Wrong');
    });

    test('returns 404 when email not found', async () => {
      customerModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app)
        .post('/api/customer/customer-login')
        .send({ email: 'john@example.com', password: 'secret' });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Email Not Found');
    });
  });

  describe('GET /api/customer/logout', () => {
    test('clears cookie on logout', async () => {
      const res = await request(app).get('/api/customer/logout');
      expect(res.statusCode).toBe(200);
      expect(res.headers['set-cookie']).toBeDefined();
    });
  });

  describe('GET /api/customer/me', () => {
    test('requires auth', async () => {
      const res = await request(app).get('/api/customer/me');
      expect(res.statusCode).toBe(401);
    });
  });

  describe('POST /api/customer/forgot-password', () => {
    test('returns 200 when email found', async () => {
      customerModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({
          id: '1',
          password: 'hashed',
          save: jest.fn()
        })
      });
      bcrypt.hash = jest.fn().mockResolvedValue('newhashed');

      const res = await request(app)
        .post('/api/customer/forgot-password')
        .send({ email: 'john@example.com' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('A new password has been sent to your email');
    });

    test('returns 404 when email missing', async () => {
      customerModel.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      const res = await request(app)
        .post('/api/customer/forgot-password')
        .send({ email: 'missing@example.com' });

      expect(res.statusCode).toBe(404);
      expect(res.body.error).toBe('Email Not Found');
    });
  });
});
