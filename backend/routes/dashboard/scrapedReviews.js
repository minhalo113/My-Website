import express from "express";
import authMiddleware from "../../middlewares/authMiddleware.js";
import scrapedReviewController from "../../controllers/dashbaord/scrapedReviewsController.js";

const scrapedReviewRouter = express.Router();

scrapedReviewRouter.post('/reviews/scraping', scrapedReviewController.receive_scraped_reviews);
scrapedReviewRouter.get('/reviews/scraped', authMiddleware, scrapedReviewController.get_scraped_reviews);

export default scrapedReviewRouter;