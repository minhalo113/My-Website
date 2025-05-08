import homeController from "../../controllers/home/homeController.js"
import express from "express"

const homeRouter = express.Router()

homeRouter.get('/customers-category-get', homeController.get_category)
homeRouter.get('/customers-products-get', homeController.products_get)
homeRouter.get('/customers-product-get/:productId', homeController.product_get)

export default homeRouter;