import request from 'supertest';
import express from 'express';

jest.mock('formidable', () => {
  const parseMock = jest.fn();
  const form = jest.fn(() => ({ parse: parseMock }));
  form.parseMock = parseMock;
  return { __esModule: true, default: form };
});
import formidable from 'formidable';
const parseMock = formidable.parseMock;

// mock cloudinary
jest.mock('cloudinary', () => {
  const uploadMock = jest.fn();
  const destroyMock = jest.fn();
  const configMock = jest.fn();
  return {
    __esModule: true,
    v2: {
      uploader: {
        upload: uploadMock,
        destroy: destroyMock,
      },
      config: configMock,
    },
    uploadMock,
    destroyMock,
    configMock,
  };
});
import { uploadMock, destroyMock } from 'cloudinary';

// bypass auth middleware
jest.mock('../middlewares/authMiddleware.js', () => ({
  __esModule: true,
  default: jest.fn((req, res, next) => next()),
}));
import authMiddleware from '../middlewares/authMiddleware.js';

// mock model
jest.mock('../models/homeSwiperModel.js', () => {
  const createMock = jest.fn();
  const findMock = jest.fn();
  const findByIdMock = jest.fn();
  const findByIdAndDeleteMock = jest.fn();
  return {
    __esModule: true,
    default: {
      create: createMock,
      find: findMock,
      findById: findByIdMock,
      findByIdAndDelete: findByIdAndDeleteMock,
    },
    createMock,
    findMock,
    findByIdMock,
    findByIdAndDeleteMock,
  };
});
import { createMock, findMock, findByIdMock, findByIdAndDeleteMock } from '../models/homeSwiperModel.js';

import homeSwiperRoutes from '../routes/dashboard/homeSwiperRoutes.js';

const app = express();
app.use('/api', homeSwiperRoutes);

describe('Home Swiper Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/home-swiper-add uploads slider image', async () => {
    parseMock.mockImplementation((req, cb) => cb(null, { link: 'http://example.com' }, { image: { filepath: 'file' } }));
    uploadMock.mockResolvedValue({ url: 'http://img', public_id: '123' });
    createMock.mockResolvedValue({ _id: '1', image: { url: 'http://img', publicId: '123' }, link: 'http://example.com' });

    const res = await request(app)
      .post('/api/home-swiper-add')
      .attach('image', Buffer.from('fake'), 'test.png')
      .field('link', 'http://example.com');

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Swiper item added');
    expect(res.body.item).toEqual({ _id: '1', image: { url: 'http://img', publicId: '123' }, link: 'http://example.com' });
    expect(authMiddleware).toHaveBeenCalled();
  });

  test('GET /api/home-swiper-get returns list', async () => {
    findMock.mockReturnValue({ sort: jest.fn().mockResolvedValue([{ _id: '1', link: 'http://example.com', image: { url: 'http://img' } }]) });

    const res = await request(app).get('/api/home-swiper-get');

    expect(res.statusCode).toBe(200);
    expect(res.body.items).toEqual([{ _id: '1', link: 'http://example.com', image: { url: 'http://img' } }]);
  });

  test('DELETE /api/home-swiper/:id deletes item', async () => {
    findByIdMock.mockResolvedValue({ _id: '1', image: { publicId: '123' } });
    destroyMock.mockResolvedValue({});
    findByIdAndDeleteMock.mockResolvedValue({});

    const res = await request(app).delete('/api/home-swiper/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Item deleted');
    expect(destroyMock).toHaveBeenCalledWith('123');
    expect(findByIdAndDeleteMock).toHaveBeenCalledWith('1');
    expect(authMiddleware).toHaveBeenCalled();
  });
});