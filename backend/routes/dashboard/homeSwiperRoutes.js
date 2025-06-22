import express from 'express';
import homeSwiperController from '../../controllers/dashbaord/homeSwiperController.js';
import authMiddleware from '../../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/home-swiper-add', authMiddleware, homeSwiperController.add_item);
router.get('/home-swiper-get', homeSwiperController.get_items);
router.delete('/home-swiper/:id', authMiddleware, homeSwiperController.delete_item);

export default router;