import orderController from "../../controllers/orders/orderController.js";
import express from 'express';
import authMiddleware from './../../middlewares/authMiddleware.js';

const orderRouter = express.Router();

orderRouter.get('/seller/orders', orderController.get_seller_orders)
orderRouter.get('/seller/order/:orderId', orderController.get_seller_order)
orderRouter.put('/seller/order-delivery-status/update/:orderId', orderController.seller_order_delivery_status_update)
orderRouter.put("/seller/order-status/update/:orderId", orderController.seller_order_accept_reject_status_update)
orderRouter.put("/seller/order-payment-status/update/:orderId", orderController.seller_payment_accept_reject_status_update)
orderRouter.get('/customers-orders', authMiddleware, orderController.get_customer_orders)
orderRouter.delete('/seller/order/:orderId', authMiddleware, orderController.delete_order)

export default orderRouter;