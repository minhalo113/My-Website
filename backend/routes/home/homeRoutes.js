import homeController from "../../controllers/home/homeController.js"
import express from "express"
import authMiddleware from './../../middlewares/authMiddleware.js';

const homeRouter = express.Router()

homeRouter.get('/customers-category-get', homeController.get_category)
homeRouter.get('/customers-products-get', homeController.products_get)
homeRouter.get('/customers-product-get/:productId', homeController.product_get)
homeRouter.post('/rate-product/:productId', authMiddleware, homeController.rate_product)
homeRouter.get('/get-reviews/:productId', homeController.get_reviews)

export default homeRouter;