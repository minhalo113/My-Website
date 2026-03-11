import scrapedReviewModel from "../../models/scrapedReviewModel.js";
import responseReturn from "../../utils/response.js";
import productModel from "../../models/productModel.js";
import { v2 as cloudinary } from 'cloudinary';
import { buildStoredReviewImage } from "../../utils/reviewImageUtils.js";

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

    update_scraped_review = async (req, res) => {
        try {
            const { id } = req.params;
            const { content, reviewImages, authorThumb, date, rating } = req.body;

            const review = await scrapedReviewModel.findById(id);
            if (!review) {
                return responseReturn(res, 404, { error: 'Scraped review not found.' });
            }

            if (content !== undefined) review.content = content;
            if (reviewImages !== undefined) review.reviewImages = reviewImages;
            if (authorThumb !== undefined) review.authorThumb = authorThumb;
            if (date !== undefined) review.date = date;
            if (rating !== undefined) review.rating = Number(rating);

            await review.save();

            return responseReturn(res, 200, { message: 'Review updated successfully.', review });
        } catch (error) {
            console.error('Error updating scraped review:', error);
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

    generateRandomCustomerName = () => {
        const firstNames = [
            'Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Charlie', 'Drew', 'Avery',
            'John', 'Michael', 'David', 'Chris', 'Mike', 'Sarah', 'Emily', 'Jessica', 'Ashley', 'Amanda',
            'Brian', 'Kevin', 'Jason', 'Matthew', 'Justin', 'Megan', 'Lauren', 'Hannah', 'Rachel', 'Samantha',
            'Daniel', 'Robert', 'James', 'William', 'Joseph', 'Jennifer', 'Linda', 'Mary', 'Patricia', 'Elizabeth',
            'Thomas', 'Richard', 'Charles', 'Steven', 'Paul', 'Susan', 'Margaret', 'Dorothy', 'Lisa', 'Nancy',
            'Mark', 'Donald', 'George', 'Kenneth', 'Betty', 'Helen', 'Sandra', 'Donna', 'Carol', 'Ruth',
            'Kaito', 'Yuki', 'Kenji', 'Akira', 'Mei', 'Chloe', 'Ethan', 'Noah',
            'Minh', 'Ali', 'Chen', 'Wei', 'Omar', 'Aisha', 'Carlos', 'Mateo'
        ];

        const lastNames = [
            'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
            'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
            'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
            'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
            'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
            'Tanaka', 'Sato', 'Suzuki', 'Takahashi', 'Watanabe', '', 'Lee', 'Park', 'Zhang', 'Wang',
            'Singh', 'Patel', 'Gupta', 'Khan', 'Ahmed', 'Rodriguez', 'Martinez', 'Lopez', 'Gonzalez', 'Perez'
        ];

        const getRand = (arr) => arr[Math.floor(Math.random() * arr.length)];
        const fName = getRand(firstNames);
        const lName = getRand(lastNames);

        const roll = Math.random();

        if (roll < 0.30) {
            return Math.random() > 0.5
                ? `${fName.toLowerCase()} ${lName.toLowerCase()}`
                : `${fName.toLowerCase()} ${lName.charAt(0).toLowerCase()}.`;
        }

        if (roll < 0.55) {
            const privacyRoll = Math.random();
            if (privacyRoll < 0.3) return `${fName.charAt(0).toUpperCase()}. ${lName}`;
            if (privacyRoll < 0.6) return `${fName}`;
            return `${fName.charAt(0).toUpperCase()}. ${lName.charAt(0).toUpperCase()}.`;
        }

        if (roll < 0.70) {
            const suffixes = ['99', '00', '88', '_x', '123', 'TTV'];
            return `${fName.toLowerCase()}${getRand(suffixes)}`;
        }

        if (roll < 0.75) {
            return `${fName.charAt(0).toLowerCase()}${fName.slice(1)} ${lName}`;
        }

        return `${fName} ${lName}`;
    }

    approve_scraped_review = async (req, res) => {
        try {
            const { id } = req.params;

            const review = await scrapedReviewModel.findById(id);
            if (!review) {
                return responseReturn(res, 404, { error: 'Scraped review not found.' });
            }

            const product = await productModel.findById(review.productId);
            if (!product) {
                return responseReturn(res, 404, { error: 'Product associated with this review not found.' });
            }

            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true
            });

            const userName = this.generateRandomCustomerName();

            let userImage = null;

            if (review.authorThumb && review.authorThumb !== "//ae-pic-a1.aliexpress-media.com/kf/S47ea903b3b7a441087bea451695cc7a2x/144x144.png_960x960.png_.avif") {
                try {
                    const uploadResult = await cloudinary.uploader.upload(review.authorThumb, {
                        folder: 'products/reviews/profiles',
                    });
                    if (uploadResult?.secure_url || uploadResult?.url) {
                        userImage = {
                            public_id: uploadResult.public_id,
                            url: uploadResult.secure_url || uploadResult.url
                        };
                    }
                } catch (uploadError) {
                    console.error('Failed to upload authorThumb to Cloudinary, falling back to original URL:', uploadError);
                }
            }

            const reviewImages = [];
            if (review.reviewImages && review.reviewImages.length > 0) {
                for (const imgUrl of review.reviewImages) {
                    try {
                        const uploadResult = await cloudinary.uploader.upload(imgUrl, {
                            folder: 'products/reviews/gallery',
                        });
                        const storedImage = buildStoredReviewImage(uploadResult);
                        if (storedImage) {
                            reviewImages.push(storedImage);
                        } else {
                            reviewImages.push({ public_id: null, url: imgUrl });
                        }
                    } catch (uploadError) {
                        console.error('Failed to upload review image to Cloudinary, falling back to original URL:', uploadError);
                        reviewImages.push({ public_id: null, url: imgUrl });
                    }
                }
            }

            let reviewDate;
            try {
                reviewDate = new Date(review.date);
                if (isNaN(reviewDate.getTime())) {
                    reviewDate = new Date();
                }
            } catch (e) {
                reviewDate = new Date();
            }

            const newRating = {
                name: userName,
                rating: review.rating,
                comment: review.content || '',
                images: reviewImages,
                userImage: userImage,
                reviewDate: reviewDate,
                createdAt: new Date(),
                updatedAt: new Date(),
                isEdited: false
            };

            product.ratings.push(newRating);

            const total = product.ratings.reduce((sum, rev) => sum + rev.rating, 0);
            product.averageRating = Math.round((total / product.ratings.length) * 10) / 10;
            product.reviewCount = product.ratings.length;

            await product.save();

            await scrapedReviewModel.findByIdAndDelete(id);

            return responseReturn(res, 200, { message: 'Review approved and added to product.' });
        } catch (error) {
            console.error('Error approving scraped review:', error);
            return responseReturn(res, 500, { error: 'Internal server error.' });
        }
    }

    reject_scraped_review = async (req, res) => {
        try {
            const { id } = req.params;

            const review = await scrapedReviewModel.findByIdAndDelete(id);
            if (!review) {
                return responseReturn(res, 404, { error: 'Scraped review not found.' });
            }

            return responseReturn(res, 200, { message: 'Review rejected and deleted.' });
        } catch (error) {
            console.error('Error rejecting scraped review:', error);
            return responseReturn(res, 500, { error: 'Internal server error.' });
        }
    }
}

export default new scrapedReviewController();