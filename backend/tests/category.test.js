import request from 'supertest';
import express from 'express';

jest.mock('../middlewares/authMiddleware.js', () => ({
  __esModule: true,
  default: (req, res, next) => next()
}), { virtual: true });

const mockParse = jest.fn();

jest.mock('formidable', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    parse: mockParse
  }))
}));

jest.mock('cloudinary', () => ({
  v2: {
    uploader: { upload: jest.fn() },
    config: jest.fn()
  }
}));

jest.mock('../models/categoryModel.js', () => ({
  create: jest.fn(),
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn()
}));

jest.mock('../utils/response.js', () => ({
  __esModule: true,
  default: (res, code, data) => {
    if (!res.headersSent) {
      return res.status(code).json(data);
    }
    return res;
  }
}));

import categoryRouter from '../routes/dashboard/categoryRoutes.js';
import categoryModel from '../models/categoryModel.js';
import { v2 as cloudinary } from 'cloudinary';
import formidable from 'formidable';

const app = express();
app.use(express.json());
app.use('/api', categoryRouter);

beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  console.log.mockRestore();
});

describe('POST /api/category-add', () => {
  test('add new category, expect success', async () => {
    mockParse.mockImplementation((req, cb) => cb(null, { name: ['Electronics'] }, { image: [{ filepath: 'path' }] }));
    cloudinary.uploader.upload.mockResolvedValue({ url: 'img-url' });
    categoryModel.create.mockResolvedValue({ _id: '1', name: 'Electronics', slug: 'Electronics', image: 'img-url' });

    const res = await request(app).post('/api/category-add');

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Category Added Successfully');
    expect(categoryModel.create).toHaveBeenCalledWith({ name: 'Electronics', slug: 'Electronics', image: 'img-url' });
  });
});

describe('GET /api/category-get', () => {
  test('retrieve list with pagination and search', async () => {
    const mockQuery = {
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockResolvedValue([{ _id: '1', name: 'Electronics' }])
    };
    const mockCountQuery = {
      countDocuments: jest.fn().mockResolvedValue(1)
    };
    categoryModel.find
      .mockReturnValueOnce(mockQuery)
      .mockReturnValueOnce(mockCountQuery);

    const res = await request(app).get('/api/category-get?page=1&parPage=5&searchValue=');

    expect(res.statusCode).toBe(200);
    expect(res.body.categorys).toEqual([{ _id: '1', name: 'Electronics' }]);
    expect(res.body.totalCategory).toBe(1);
  });
});

describe('PUT /api/category-update/:id', () => {
  test('update existing category', async () => {
    mockParse.mockImplementation((req, cb) => cb(null, { name: ['Books'] }, { image: [{ filepath: 'path' }] }));
    cloudinary.uploader.upload.mockResolvedValue({ url: 'new-img' });
    categoryModel.findByIdAndUpdate.mockResolvedValue({ _id: '1', name: 'Books', slug: 'Books', image: 'new-img' });

    const res = await request(app).put('/api/category-update/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Category Updated Successfully');
    expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith('1', { name: 'Books', slug: 'Books', image: 'new-img' }, { new: true });
  });
});

describe('DELETE /api/category/:id', () => {
  test('remove category, verify 404 on second delete', async () => {
    categoryModel.findByIdAndDelete.mockResolvedValueOnce({ _id: '1' });
    let res = await request(app).delete('/api/category/1');
    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('Category deleted successfully');

    categoryModel.findByIdAndDelete.mockResolvedValueOnce(null);
    res = await request(app).delete('/api/category/1');
    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Category Not Found');
  });
});