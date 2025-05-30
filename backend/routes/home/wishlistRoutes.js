import express from 'express';
import wishlistController from '../../controllers/home/wishlistController.js';
import authMiddleware from './../../middlewares/authMiddleware.js';

const wishlistRouter = express.Router();

wishlistRouter.post('/add-to-wishlist', authMiddleware, wishlistController.add_to_wishlist);
wishlistRouter.post('/remove-from-wishlist', authMiddleware, wishlistController.remove_from_wishlist);
wishlistRouter.get('/wishlist', authMiddleware, wishlistController.get_products_from_wishlist);

export default wishlistRouter;