import express from 'express';
import couponController from '../../controllers/dashbaord/couponController.js';
import authMiddleware from './../../middlewares/authMiddleware.js';

const couponRouter = express.Router();

couponRouter.post('/coupon-add', authMiddleware, couponController.add_coupon);
couponRouter.get('/coupon-get', authMiddleware, couponController.get_coupons);
couponRouter.post('/coupon-apply', couponController.apply_coupon)
couponRouter.delete('/coupon/:couponId', authMiddleware, couponController.delete_coupon);

export default couponRouter;