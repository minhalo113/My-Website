import request from 'supertest';
import express from 'express';
import productModel from '../models/productModel.js';

const mockParse = jest.fn();
const mockIncomingParse = jest.fn();

jest.mock('formidable', () => {
  const formidable = jest.fn(() => ({ parse: mockParse }));
  formidable.IncomingForm = jest.fn(() => ({ parse: mockIncomingParse }));
  return formidable;
});

jest.mock('../middlewares/authMiddleware.js', () => ({
  __esModule: true,
  default: (req, res, next) => {
    req.id = 'seller1';
    next();
  }
}));

jest.mock('cloudinary', () => ({
  __esModule: true,
  v2: {
    uploader: { upload: jest.fn() },
    config: jest.fn()
  }
}));

import { v2 as cloudinary } from 'cloudinary';
import productRouter from '../routes/dashboard/productRoutes.js';

const app = express();
app.use(express.json());
app.use('/api', productRouter);

afterEach(() => {
  jest.clearAllMocks();
});

describe('Product API', () => {
  test('POST /api/product-add creates product', async () => {
    mockParse.mockImplementation((req, cb) => {
      const fields = {
        name: 'Prod',
        category: 'Cat',
        description: 'Desc',
        stock: '5',
        price: '10',
        discount: '0',
        deliveryTime: '2 days',
        shopName: 'Shop',
        brand: 'Brand',
        colors: '',
        sizes: '',
        colorPrices: ''
      };
      const files = { images: [{ filepath: 'path/img.jpg' }] };
      cb(null, fields, files);
    });
    productModel.create = jest.fn().mockResolvedValue({});
    cloudinary.uploader.upload.mockResolvedValue({ url: 'http://image.jpg' });

    const res = await request(app).post('/api/product-add');

    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBe('Product Added Successfully');
    expect(productModel.create).toHaveBeenCalled();
  });

  test('GET /api/products-get returns products with pagination', async () => {
    const products = [{ id: '1' }];
    productModel.find = jest.fn()
      .mockReturnValueOnce({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(products)
      })
      .mockReturnValueOnce({
        countDocuments: jest.fn().mockResolvedValue(1)
      });

    const res = await request(app).get('/api/products-get').query({ page: 1, parPage: 10 });

    expect(res.statusCode).toBe(200);
    expect(res.body.products).toEqual(products);
    expect(res.body.totalProduct).toBe(1);
  });

  test('GET /api/product-get/:id returns product', async () => {
    const product = { id: '1' };
    productModel.findById = jest.fn().mockResolvedValue(product);

    const res = await request(app).get('/api/product-get/1');

    expect(res.statusCode).toBe(200);
    expect(res.body.product).toEqual(product);
  });

  test('POST /api/product-update updates product', async () => {
    const initialProduct = { colorImages: [] };
    const updatedProduct = { ...initialProduct, name: 'Updated', price: 200 };
    productModel.findById = jest.fn()
      .mockResolvedValueOnce(initialProduct)
      .mockResolvedValueOnce(updatedProduct);
    productModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});

    const res = await request(app)
      .post('/api/product-update')
      .send({
        name: 'Updated',
        description: 'Desc',
        stock: 5,
        price: 200,
        category: 'Cat',
        discount: 0,
        deliveryTime: '',
        brand: 'Brand',
        colors: '',
        sizes: '',
        colorPrices: '',
        productId: '1'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Product Updated Successfully');
    expect(res.body.product).toEqual(updatedProduct);
  });

  test('POST /api/product-image-update updates image', async () => {
    mockIncomingParse.mockImplementation((req, cb) => {
      const fields = { oldImage: 'old.jpg', productId: '1', imageType: 'image' };
      const files = { newImage: [{ filepath: 'path/new.jpg' }] };
      cb(null, fields, files);
    });
    productModel.findById = jest.fn()
      .mockResolvedValueOnce({ images: ['old.jpg'] })
      .mockResolvedValueOnce({ images: ['new.jpg'] });
    productModel.findByIdAndUpdate = jest.fn().mockResolvedValue({});
    cloudinary.uploader.upload.mockResolvedValue({ url: 'new.jpg' });

    const res = await request(app).post('/api/product-image-update');

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Product Image Updated Successfully');
    expect(res.body.product.images[0]).toBe('new.jpg');
  });

  test('DELETE /api/product/:id removes product', async () => {
    productModel.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: '1' });

    const res = await request(app).delete('/api/product/1');

    expect(res.statusCode).toBe(200);
    expect(res.body).toBe('Product deleted successfully');
    expect(productModel.findByIdAndDelete).toHaveBeenCalledWith('1');
  });
});