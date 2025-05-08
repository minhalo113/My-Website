import customerAuthController from "../../controllers/home/customerAuthController.js"
import express from "express"

const customerAuthControllerRouter = express.Router()

customerAuthControllerRouter.post('/customer/customer-register', customerAuthController.customer_register)
customerAuthControllerRouter.post('/customer/customer-login', customerAuthController.customer_login)
customerAuthControllerRouter.get('/customer/logout', customerAuthController.customer_logout)

export default customerAuthControllerRouter;