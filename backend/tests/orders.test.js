import request from 'supertest';
import express from 'express';

let app;
let customerOrder;

beforeAll(async () => {
  jest.doMock('../middlewares/authMiddleware.js', () => ({
    __esModule: true,
    default: (req, res, next) => {
      req.user = { id: 'cust1' };
      next();
    }
  }));

  customerOrder = (await import('../models/orderModel.js')).default;
  const { default: orderRouter } = await import('../routes/orders/orderRoutes.js');

  app = express();
  app.use(express.json());
  app.use('/api', orderRouter);
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('Orders API', () => {
  describe('GET /api/seller/orders', () => {
    test('fetches seller orders', async () => {
      customerOrder.find = jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([{ _id: '1' }])
      });
      customerOrder.countDocuments = jest.fn().mockResolvedValue(1);

      const res = await request(app)
        .get('/api/seller/orders')
        .query({ page: 1, parPage: 10 });

      expect(res.statusCode).toBe(200);
      expect(res.body.orders).toEqual([{ _id: '1' }]);
      expect(res.body.totalOrder).toBe(1);
    });
  });

  describe('GET /api/seller/order/:id', () => {
    test('returns order details', async () => {
      customerOrder.findById = jest.fn().mockResolvedValue({ _id: '1' });

      const res = await request(app).get('/api/seller/order/1');

      expect(res.statusCode).toBe(200);
      expect(res.body.order).toEqual({ _id: '1' });
    });
  });

  describe('PUT /api/seller/order-delivery-status/update/:id', () => {
    test('updates delivery status', async () => {
      customerOrder.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const res = await request(app)
        .put('/api/seller/order-delivery-status/update/1')
        .send({ delivery_status: 'delivered' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('order delivery status updated successfully');
    });
  });

  describe('PUT /api/seller/order-status/update/:id', () => {
    test('updates order status', async () => {
      customerOrder.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const res = await request(app)
        .put('/api/seller/order-status/update/1')
        .send({ order_status: 'accepted' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('order status updated successfully');
    });
  });

  describe('PUT /api/seller/order-payment-status/update/:id', () => {
    test('updates payment status', async () => {
      customerOrder.findByIdAndUpdate = jest.fn().mockResolvedValue({});

      const res = await request(app)
        .put('/api/seller/order-payment-status/update/1')
        .send({ payment_status: 'paid' });

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('payment status updated successfully');
    });
  });

  describe('GET /api/customers-orders', () => {
    test("returns customer's orders", async () => {
      customerOrder.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue([{ _id: '1', customerId: 'cust1' }])
      });

      const res = await request(app).get('/api/customers-orders');

      expect(res.statusCode).toBe(200);
      expect(res.body.orders).toEqual([{ _id: '1', customerId: 'cust1' }]);
    });
  });

  describe('DELETE /api/seller/order/:id', () => {
    test('deletes an order', async () => {
      customerOrder.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: '1' });

      const res = await request(app).delete('/api/seller/order/1');

      expect(res.statusCode).toBe(200);
      expect(res.body).toBe('Order deleted successfully');
    });
  });
});
