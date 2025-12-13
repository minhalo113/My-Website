import request from 'supertest';
import express from 'express';

let app;
let orderModel;
let sendMail;
let couponController;
let stripeMocks;

beforeAll(async () => {
  process.env.STRIPE_SECRET_KEY = 'sk_test';
  process.env.GIT_WEB_URL = 'http://example.com';
  process.env.WEBHOOK_ENDPOINT = '/webhook';

  const createSessionMock = jest.fn().mockResolvedValue({ url: 'checkout-url' });
  const constructEventMock = jest.fn();
  jest.doMock('stripe', () => {
    return jest.fn().mockImplementation(() => ({
      checkout: { sessions: { create: createSessionMock } },
      webhooks: { constructEvent: constructEventMock }
    }));
  });

  const orderMock = {
    create: jest.fn().mockResolvedValue({ _id: 'order123' }),
    findByIdAndUpdate: jest.fn(),
  };
  jest.doMock('../models/orderModel.js', () => ({
    __esModule: true,
    default: orderMock,
  }));

  const mailMock = { sendMail: jest.fn().mockResolvedValue({}) };
  jest.doMock('../utils/mail.js', () => ({
    __esModule: true,
    sendMail: mailMock.sendMail,
  }));

  const couponMock = { use_coupon: jest.fn() };
  jest.doMock('../controllers/dashbaord/couponController.js', () => ({
    __esModule: true,
    default: couponMock,
  }));

  const paymentRouterMod = await import('../routes/home/paymentRoutes.js');
  const paymentControllerMod = await import('../controllers/home/paymentController.js');

  app = express();
  app.post('/webhook', express.raw({ type: 'application/json' }), paymentControllerMod.default.handle_webhook);
  app.use(express.json());
  app.use('/api', paymentRouterMod.default);

  orderModel = orderMock;
  sendMail = mailMock.sendMail;
  couponController = couponMock;
  stripeMocks = { createSessionMock, constructEventMock };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('POST /api/create-payment-session', () => {
  test('returns checkout url when cart and shipping provided', async () => {
    const res = await request(app)
      .post('/api/create-payment-session')
      .send({
        cartItems: [{ name: 'Prod', price: 10, qty: 1 }],
        shipping: { address: '123' },
        is_login: { id: '1', email: 'a@example.com', name: 'A' },
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.url).toBe('checkout-url');
    expect(orderModel.create).toHaveBeenCalled();
  });

  test('returns 400 when missing cart', async () => {
    const res = await request(app)
      .post('/api/create-payment-session')
      .send({ shipping: { address: '123' } });

    expect(res.statusCode).toBe(400);
  });
});

describe('Webhook WEBHOOK_ENDPOINT', () => {
  test('updates order and sends email', async () => {
    const event = {
      type: 'checkout.session.completed',
      data: {
        object: {
          metadata: { orderId: 'order123', couponId: 'coupon1' },
          amount_total: 5000,
          customer_details: { email: 'c@example.com' },
        },
      },
    };
    stripeMocks.constructEventMock.mockReturnValue(event);

    const res = await request(app)
      .post('/webhook')
      .set('stripe-signature', 'sig')
      .send('{}');

    expect(res.statusCode).toBe(200);
    expect(orderModel.findByIdAndUpdate).toHaveBeenCalledWith('order123', { payment_status: 'Uncaptured' });
    expect(couponController.use_coupon).toHaveBeenCalledWith('coupon1');
    expect(sendMail).toHaveBeenCalled();
  });
});