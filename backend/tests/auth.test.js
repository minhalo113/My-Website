import request from 'supertest';
import express from 'express';

// mock dependencies
import adminModel from '../models/adminModel.js';
import bcrypt from 'bcrypt';
jest.mock('../utils/tokenCreate.js', () => ({
  __esModule: true,
  default: jest.fn()
}));

import authRouter from '../routes/authRoutes.js';

afterEach(() => {
  jest.resetAllMocks();
});

const app = express();
app.use(express.json());
app.use('/api', authRouter);

describe('POST /api/admin-login', () => {
  test('returns 200 on successful login', async () => {
    adminModel.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        id: '1',
        role: 'admin',
        name: 'Admin',
        email: 'admin@example.com',
        password: 'hashed',
        images: 'img'
      })
    });
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    createToken = jest.fn().mockResolvedValue('token');

    const res = await request(app)
      .post('/api/admin-login')
      .send({ email: 'admin@example.com', password: 'secret' });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Login Success');
  });

  test('returns 401 when password wrong', async () => {
    adminModel.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({
        id: '1',
        role: 'admin',
        name: 'Admin',
        email: 'admin@example.com',
        password: 'hashed',
        images: 'img'
      })
    });
    bcrypt.compare = jest.fn().mockResolvedValue(false);

    const res = await request(app)
      .post('/api/admin-login')
      .send({ email: 'admin@example.com', password: 'wrong' });

    expect(res.statusCode).toBe(401);
    expect(res.body.error).toBe('Password Wrong');
  });

  test('returns 500 when admin not found', async () => {
    adminModel.findOne = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue(null)
    });
    const res = await request(app)
      .post('/api/admin-login')
      .send({ email: 'missing@example.com', password: 'secret' });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Email Not Found');
  });
});
