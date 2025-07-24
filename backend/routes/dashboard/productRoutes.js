import productController from "../../controllers/dashbaord/productController.js";
import express from "express"
import authMiddleware from "../../middlewares/authMiddleware.js"

const productRouter = express.Router()

productRouter.post('/product-add', authMiddleware, productController.add_product)
productRouter.get('/products-get', authMiddleware, productController.products_get)
productRouter.get('/product-get/:productId', authMiddleware, productController.product_get)
productRouter.post('/product-update', authMiddleware, productController.product_update)
productRouter.post('/product-image-update', authMiddleware, productController.product_image_update)
productRouter.delete('/product/:id', authMiddleware, productController.deleteProduct)

export default productRouter