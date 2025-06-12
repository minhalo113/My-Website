import customerAuthController from "../../controllers/home/customerAuthController.js"
import express from "express"
import authMiddleware from './../../middlewares/authMiddleware.js';

const customerAuthControllerRouter = express.Router()

customerAuthControllerRouter.post('/customer/customer-register', customerAuthController.customer_register)
customerAuthControllerRouter.post('/customer/customer-login', customerAuthController.customer_login)
customerAuthControllerRouter.get('/customer/logout', customerAuthController.customer_logout)
customerAuthControllerRouter.get('/customer/me', authMiddleware, customerAuthController.customer_get_info)
customerAuthControllerRouter.post('/customer/profile-image', authMiddleware, customerAuthController.customer_change_avater)
customerAuthControllerRouter.post('/customer/update-profile', authMiddleware, customerAuthController.customer_update_password)
customerAuthControllerRouter.post('/customer/forgot-password', customerAuthController.customer_forgot_password)

export default customerAuthControllerRouter;