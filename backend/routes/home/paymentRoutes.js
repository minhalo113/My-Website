import express from 'express';
import paymentController from '../../controllers/home/paymentController.js';

const paymentRouter = express.Router();

paymentRouter.post('/create-payment-session', paymentController.create_payment_session);

export default paymentRouter;