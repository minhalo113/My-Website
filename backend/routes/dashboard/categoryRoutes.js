import categoryController from "../../controllers/dashbaord/categoryController.js"
import express from "express"
import authMiddleware from "../../middlewares/authMiddleware.js"

const categoryRouter = express.Router()

categoryRouter.post('/category-add', authMiddleware, categoryController.add_category)
categoryRouter.get('/category-get', authMiddleware, categoryController.get_category)
categoryRouter.put('/category-update/:id', authMiddleware, categoryController.update_category)
categoryRouter.delete('/category/:id', authMiddleware, categoryController.deleteCategory)

export default categoryRouter;