import request from 'supertest';
import express from 'express';
import contactRouter from '../routes/home/contactRoutes.js';

describe('POST /api/contact', () => {
  test('dispatches email via Resend', async () => {
    process.env.RESEND_API_KEY = 'key';
    process.env.RESEND_FROM = 'from@example.com';
    process.env.RESEND_TO = 'to@example.com';
    global.fetch = jest.fn().mockResolvedValue({ ok: true, text: () => Promise.resolve('') });

    const app = express();
    app.use(express.json());
    app.use('/api', contactRouter);

    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'John',
        email: 'john@example.com',
        number: '123',
        subject: 'Hello',
        message: 'Test',
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Message sent');
    expect(fetch).toHaveBeenCalled();
  });
});