import request from 'supertest';
import express from 'express';

let app;
let coupons;

beforeAll(async () => {
  coupons = [];

  jest.resetModules();

  jest.doMock('../models/couponModel.js', () => ({
    __esModule: true,
    default: {
      findOne: jest.fn(async ({ code }) => coupons.find(c => c.code === code) || null),
      create: jest.fn(async ({ code, discount, maxUses }) => {
        const newCoupon = { _id: String(coupons.length + 1), code, discount, maxUses, used: 0 };
        coupons.push(newCoupon);
        return newCoupon;
      }),
      find: jest.fn(() => ({
        sort: jest.fn(async () => [...coupons])
      })),
      findByIdAndDelete: jest.fn(async id => {
        const index = coupons.findIndex(c => c._id === id);
        if (index === -1) return null;
        const [removed] = coupons.splice(index, 1);
        return removed;
      }),
    },
  }));

  const { default: couponController } = await import('../controllers/dashbaord/couponController.js');

  app = express();
  app.use(express.json());
  app.post('/api/coupon-add', couponController.add_coupon);
  app.get('/api/coupon-get', couponController.get_coupons);
  app.post('/api/coupon-apply', couponController.apply_coupon);
  app.delete('/api/coupon/:couponId', couponController.delete_coupon);
});

describe('Coupon API', () => {
  let couponId;

  test('POST /api/coupon-add creates coupon', async () => {
    const res = await request(app)
      .post('/api/coupon-add')
      .send({ code: 'SAVE10', discount: 10, maxUses: 5 });

    expect(res.statusCode).toBe(201);
    expect(res.body.coupon.code).toBe('SAVE10');
  });

  test('GET /api/coupon-get lists coupons', async () => {
    const res = await request(app).get('/api/coupon-get');
    expect(res.statusCode).toBe(200);
    expect(res.body.coupons).toHaveLength(1);
  });

  test('POST /api/coupon-apply applies code and returns discount', async () => {
    const res = await request(app)
      .post('/api/coupon-apply')
      .send({ code: 'SAVE10' });

    expect(res.statusCode).toBe(200);
    expect(res.body.discount).toBe(10);
    couponId = res.body.couponId;
    expect(couponId).toBeDefined();
  });

  test('DELETE /api/coupon/:id deletes coupon and prevents reuse', async () => {
    const res = await request(app).delete(`/api/coupon/${couponId}`);
    expect(res.statusCode).toBe(200);

    const res2 = await request(app)
      .post('/api/coupon-apply')
      .send({ code: 'SAVE10' });

    expect(res2.statusCode).toBe(400);
    expect(res2.body.error).toBe('Invalid coupon code');
  });
});
