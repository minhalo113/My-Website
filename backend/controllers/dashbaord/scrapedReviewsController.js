import scrapedReviewModel from "../../models/scrapedReviewModel.js";
import responseReturn from "../../utils/response.js";
import productModel from "../../models/productModel.js";

class scrapedReviewController {
    receive_scraped_reviews = async (req, res) => {
        try {
            const { productId, harvestedAt, reviews } = req.body;

            if (!productId || !reviews || !Array.isArray(reviews)) {
                return responseReturn(res, 400, { error: 'Invalid payload. Ensure productId and an array of reviews are provided.' });
            }

            const product = await productModel.findById(productId);
            if (!product) {
                return responseReturn(res, 404, { error: 'Product not found.' });
            }

            const reviewDocuments = reviews.map(rev => ({
                productId,
                authorThumb: rev.authorThumb,
                rating: rev.rating,
                date: rev.date,
                content: rev.content,
                reviewImages: rev.reviewImages || [],
                harvestedAt: harvestedAt ? new Date(harvestedAt) : new Date(),
                status: 'pending'
            }));

            await scrapedReviewModel.insertMany(reviewDocuments);
            return responseReturn(res, 201, { message: 'Scraped reviews saved successfully.' });

        } catch (error) {
            console.error('Error saving scraped reviews:', error);
            return responseReturn(res, 500, { error: 'Internal server error.' });
        }
    }

    get_scraped_reviews = async (req, res) => {
        try {
            const page = parseInt(req.query.page) || 1;
            const parPage = parseInt(req.query.parPage) || 20;
            const skipPage = parPage * (page - 1);

            const pendingReviews = await scrapedReviewModel.find({ status: 'pending' })
                .populate('productId', 'name slug images')
                .sort({ createdAt: -1 })
                .skip(skipPage)
                .limit(parPage);

            const totalReviews = await scrapedReviewModel.countDocuments({ status: 'pending' });

            return responseReturn(res, 200, { reviews: pendingReviews, totalReviews });

        } catch (error) {
            console.error('Error fetching scraped reviews:', error);
            return responseReturn(res, 500, { error: 'Internal server error.' });
        }
    }
}

export default new scrapedReviewController();