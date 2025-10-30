import productController from "../../controllers/dashbaord/productController.js";
import express from "express"
import authMiddleware from "../../middlewares/authMiddleware.js"

const productRouter = express.Router()

productRouter.post('/product-add', authMiddleware, productController.add_product)
productRouter.get('/products-get', authMiddleware, productController.products_get)
productRouter.get('/product-get/:productId', authMiddleware, productController.product_get)
productRouter.post('/product-update', authMiddleware, productController.product_update)
productRouter.post('/product-image-update', authMiddleware, productController.product_image_update)
productRouter.post('/product-image-search', authMiddleware, productController.product_image_search)
productRouter.post('/product-image-precheck', authMiddleware, productController.product_image_batch_check)
productRouter.post('/product-visibility', authMiddleware, productController.product_visibility)
productRouter.post('/product-social-preview', authMiddleware, productController.generate_product_social_preview)
productRouter.post('/product-social-publish', authMiddleware, productController.publish_product_social_post)
productRouter.get('/product/:productId/reviews', authMiddleware, productController.get_product_reviews)
productRouter.patch('/product/:productId/reviews/:reviewId', authMiddleware, productController.update_product_review)
productRouter.delete('/product/:productId/reviews/:reviewId', authMiddleware, productController.delete_product_review)
productRouter.delete('/product/:id', authMiddleware, productController.deleteProduct)
productRouter.post('/product-import-aliexpress', authMiddleware, productController.import_aliexpress_product)

export default productRouter