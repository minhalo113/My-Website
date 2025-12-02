import express from 'express';
import paymentController from '../../controllers/home/paymentController.js';
import paypalController from '../../controllers/home/paypalController.js';

const paymentRouter = express.Router();

paymentRouter.post('/create-payment-session', paymentController.create_payment_session);
paymentRouter.post('/create-paypal-payment', paypalController.create_paypal_payment);

export default paymentRouter;
