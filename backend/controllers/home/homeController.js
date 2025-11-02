import formidable from 'formidable';
import {v2 as cloudinary} from 'cloudinary';
import mongoose from 'mongoose';
import productModel from "../../models/productModel.js";
import categoryModel from "../../models/categoryModel.js";
import responseReturn from "../../utils/response.js";
import { fingerprintFromUploadResult } from "../../utils/imageFingerprint.js";
import {searchCatalogProducts} from "../../services/productSearchService.js";
import { computeEffectivePrice } from "../../utils/effectivePrice.js";
import {
    fetchProductsForImageSearch,
    collectMatchesForFingerprint,
} from "../../utils/productImageSearch.js";
import { formatReviewForResponse, formatReviewListForResponse, repositionReviewInPlace } from "../../utils/reviewFormatter.js";

const { Types } = mongoose;

class homeControllers{
    formateProduct = (products) => {
        const productArray = [];
        let i = 0;
        while (i < products.length ) {
            let temp = []
            let j = i
            while (j < i + 3) {
                if (products[j]) {
                    temp.push(products[j])
                }
                j++
            }
            productArray.push([...temp])
            i = j
        }
        return productArray
    }

    get_category = async(req, res) => {
        const {page, searchValue, parPage} = req.query

        try{
            let skipPage = ''
            if(parPage && page){
                skipPage = parseInt(parPage) * (parseInt(page) - 1)
            }
            
            if(searchValue && page && parPage){
                const categorys = await categoryModel.find({
                    $text: { $search: searchValue}
                }).skip(skipPage).limit(parPage).sort({createdAt: -1})

                const totalCategory = await categoryModel.find({
                    $text: { $search: searchValue }
                }).countDocuments()
                return responseReturn(res, 200, {categorys, totalCategory})
            }else if (searchValue === '' && page && parPage){
                const categorys = await categoryModel.find({ }).skip(skipPage).limit(parPage).sort({createdAt: -1})
                const totalCategory = await categoryModel.find({ }).countDocuments()
                return responseReturn(res, 200, {categorys, totalCategory})
            }
            else{
                const categorys = await categoryModel.find({ }).sort({createdAt: -1})
                const totalCategory = await categoryModel.find({ }).countDocuments()
                return responseReturn(res, 200, {categorys, totalCategory})
            }
            
        }catch(error){
            console.log(error)
            return responseReturn(res, 500, {error: "Internal Server Error"})
        }
    }

    products_get = async(req, res) => {
        const {page, searchValue, parPage, category, minPrice, maxPrice} = req.query

        const trimmedSearch = typeof searchValue === 'string' ? searchValue.trim() : ''
        const hasPriceFilter = minPrice !== undefined || maxPrice !== undefined
        const shouldUseSearchServie = Boolean(trimmedSearch) || (page && parPage) || (category && category !== 'all') || hasPriceFilter

        if (shouldUseSearchServie) {
            try{
                const searchResponse = await searchCatalogProducts({
                    term: trimmedSearch,
                    category,
                    page,
                    limit: parPage,
                    includeFacets: Boolean(trimmedSearch),
                    includeSuggestions: Boolean(trimmedSearch),
                    minPrice,
                    maxPrice,
                })

                const payload = {
                    products: searchResponse.results,
                    totalProduct: searchResponse.total,
                    page: searchResponse.page,
                    parPage: searchResponse.perPage,
                }

                if (searchResponse.facets){
                    payload.facets = searchResponse.facets
                }

                if (Array.isArray(searchResponse.suggestions)){
                    payload.suggestions = searchResponse.suggestions
                }
                
                if(searchResponse.metrics){
                    payload.metrics = searchResponse.metrics
                }
                if (searchResponse.filters){
                    payload.filters = searchResponse.filters
                }
                return responseReturn(res, 200, payload)
            }catch(error){
                console.log(error)
                return responseReturn(res, 500, {error: "Unable to load products right now."})
            }
        }

        try{
            const products = await productModel.find({ isHidden: false }).sort({createdAt: -1})
            const normalizedProducts = products.map((product) => {
                const effectivePrice = computeEffectivePrice(product)
                if (typeof product?.set === 'function') {
                    product.set('price', effectivePrice)
                    return product
                }
                return {
                    ...product,
                    price: effectivePrice
                }
            })
            const totalProduct = await productModel.countDocuments({isHidden: false})

            return responseReturn(res, 200, {products: normalizedProducts, totalProduct})
        }catch(error){
            return responseReturn(res, 500, {error: error.message})
        }
    }

    products_search = async(req, res) => {
        const {q, searchValue, page, limit, parPage, category, minPrice, maxPrice} = req.query

        const rawTerm = typeof q === 'string' ? q : searchValue
        const trimmedTerm = typeof rawTerm === 'string' ? rawTerm.trim() : ''
        const sizeParam = limit ?? parPage
        const fallbackPerPage = Math.max(parseInt(sizeParam, 10) || 10, 1)

        if (!trimmedTerm) {
            return responseReturn(res, 200, {
                searchTerm: '',
                results: [],
                totalResults: 0,
                page: 1,
                perPage: fallbackPerPage,
                totalPages: 0,
                suggestions: [],
                facets: {
                    categories: [],
                    brands: []
                },
                filters: {
                    category: (category && category !== 'all') ? category : null,
                },
                metrics: {
                    queryTimeMs: 0,
                    servedFromCache: false,
                    cacheKeyHit: false
                },
            })
        }
        
        try{
            const searchResponse = await searchCatalogProducts({
                term: trimmedTerm,
                category,
                page,
                limit: sizeParam,
                includeFacets: true,
                includeSuggestions: true,
                minPrice,
                maxPrice,
            })

            return responseReturn(res, 200, {
                ...searchResponse,
                totalResults: searchResponse.total,
            })
        }catch(error){
            console.log(error)
            return responseReturn(res, 500, {error: 'Unable to search products right now'})
        }
    }

    product_get = async(req, res) => {
        const {productId} = req.params;
        try{
            const product = await productModel.findOne({_id: productId, isHidden: false}).lean()
            if(!product){
                return responseReturn(res, 404, {error: 'Product not found'})
            }
            const sanitizedProduct = {
                ...product,
                ratings: formatReviewListForResponse(product?.ratings || []),
            }
            return responseReturn(res, 200, {product: sanitizedProduct})
        }catch(error){
            return responseReturn(res, 500, {error: error.message})
        }
    }

    rate_product = async(req, res) => {
        try{
            const {rating, comment, images = []} = req.body;
            const product = await productModel.findById(req.params.productId);

            const userId = req.user.id.toString();
            const curUser = req.user;
    
            const existing = product.ratings.find(r => {
                return r.user.toString() === userId; 
            });

            let targetReview = null;
            if(existing){
                existing.rating = rating;
                existing.comment = comment;
                existing.images = images;
                existing.updatedAt = new Date();
                existing.isEdited = true;
                existing.userImage = curUser.image;
                if (!existing.reviewDate) {
                    existing.reviewDate = existing.createdAt || new Date();
                }
                if (!existing.createdAt) {
                    existing.createdAt = new Date();
                }
                targetReview = existing;
            }else{
                product.ratings.push({
                    user: userId,
                    rating,
                    comment,
                    images,
                    name: curUser.name,
                    userImage: curUser.image,
                    reviewDate: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isEdited: false
                });
                targetReview = product.ratings[product.ratings.length - 1];
            }

            if (targetReview) {
                repositionReviewInPlace(product.ratings, targetReview);
            }
            product.markModified('ratings');
            product.averageRating = Math.round(product.ratings.reduce((acc, r) => acc + r.rating, 0) / product.ratings.length * 10) / 10;
            product.reviewCount = product.ratings.length;
            await product.save()
            return responseReturn(res, 200, {message: "Rating saved", averageRating: product.averageRating})
        }catch(error){
            console.log(error)
            return responseReturn(res, 500, {message: error.message})
        }
    }

    get_reviews = async(req, res) => {
        const { productId } = req.params;
        const limitParam = Number.parseInt(req.query.limit, 10);
        const pageParam = Number.parseInt(req.query.page, 10);
        const limit = Math.min(Math.max(Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 10, 1), 100);
        const page = Math.max(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1, 1);
        const skip = (page - 1) * limit;

        if (!Types.ObjectId.isValid(productId)) {
            return responseReturn(res, 400, { message: 'Invalid product identifier.' });
        }

        try{
            const productObjectId = new Types.ObjectId(productId);
            const buildPipeline = (skipValue) => [
                { $match: { _id: productObjectId } },
                {
                    $facet: {
                        ratings: [
                            { $unwind: { path: '$ratings', preserveNullAndEmptyArrays: true } },
                            { $match: { ratings: { $ne: null } } },
                            { $addFields: { 'ratings.effectiveDate': { $ifNull: ['$ratings.reviewDate', '$ratings.createdAt'] } } },
                            { $sort: { 'ratings.effectiveDate': -1, 'ratings._id': -1 } },
                            { $skip: skipValue },
                            { $limit: limit },
                            { $replaceRoot: { newRoot: '$ratings' } },
                        ],
                        meta: [
                            {
                                $project: {
                                    totalReviews: { $size: '$ratings' },
                                    averageRating: '$averageRating',
                                    reviewCount: '$reviewCount',
                                },
                            },
                        ],
                    },
                },
                {
                    $addFields: {
                        totalReviews: { $ifNull: [{ $arrayElemAt: ['$meta.totalReviews', 0] }, 0] },
                        averageRating: { $ifNull: [{ $arrayElemAt: ['$meta.averageRating', 0] }, 0] },
                        reviewCount: { $ifNull: [{ $arrayElemAt: ['$meta.reviewCount', 0] }, 0] },
                    },
                },
                {
                    $project: {
                        ratings: 1,
                        totalReviews: 1,
                        averageRating: 1,
                        reviewCount: 1,
                    },
                },
            ];

            const [result] = await productModel.aggregate(buildPipeline(skip));

            if (!result) {
                const exists = await productModel.exists({ _id: productObjectId });
                if (!exists) {
                    return responseReturn(res, 404, { message: 'Product not found' });
                }
                return responseReturn(res, 200, {
                    reviewList: [],
                    totalReviews: 0,
                    totalPages: 1,
                    page,
                    limit,
                    averageRating: 0,
                    reviewCount: 0,
                });
            }

            const totalReviews = result.totalReviews || 0;
            const totalPages = totalReviews === 0 ? 1 : Math.ceil(totalReviews / limit);
            const clampedPage = totalReviews === 0 ? 1 : Math.min(page, totalPages);
            let ratings = result.ratings || [];

            if (totalReviews > 0 && page > totalPages) {
                const adjustedSkip = (totalPages - 1) * limit;
                const [adjusted] = await productModel.aggregate(buildPipeline(adjustedSkip));
                ratings = adjusted?.ratings || [];
            }
            const reviewList = ratings.map((item) => formatReviewForResponse(item));

            return responseReturn(res, 200, {
                reviewList,
                totalReviews,
                totalPages,
                page: clampedPage,
                limit,
                averageRating: result.averageRating ?? 0,
                reviewCount: result.reviewCount ?? totalReviews,
            });
        }catch(error){
            console.log(error)
            return responseReturn(res, 500, {message: error.message})
        }
    }

    product_image_search = async (req, res) => {
        const form = formidable({
            multiples: false,
            keepExtensions: true,
            allowEmptyFiles: false,
        });

        form.parse(req, async (err, fields, files) => {
            if (err) return responseReturn(res, 400, { error: err.message });

            const thresholdField = Array.isArray(fields.threshold) ? fields.threshold[0] : fields.threshold;
            const parsedThreshold = thresholdField ? parseInt(thresholdField, 10) : 64;
            const threshold = Number.isNaN(parsedThreshold)
                ? 10
                : Math.max(0, Math.min(64, parsedThreshold));

            const potentialFiles = [files.image, files.file, files.queryImage];
            const fallbackFiles = Object.values(files || {});
            const combined = potentialFiles.concat(fallbackFiles);
            const fileEntry = combined.find((item) => item) || null;
            const fileList = Array.isArray(fileEntry) ? fileEntry : fileEntry ? [fileEntry] : [];

            if (!fileList.length) {
                return responseReturn(res, 400, { error: 'Image file is required' });
            }

            const file = fileList[0];

            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true,
            });

            let temporaryPublicId = null;
            try {
                const uploadResult = await cloudinary.uploader.upload(file.filepath || file.path, {
                    folder: 'products/search-temp',
                    phash: true,
                });
                temporaryPublicId = uploadResult?.public_id || null;
                const queryFingerprint = fingerprintFromUploadResult(uploadResult);

                if (!queryFingerprint) {
                    return responseReturn(res, 422, { error: 'Unable to generate fingerprint for the provided image' });
                }

                const products = await fetchProductsForImageSearch();
                const { groupedMatches, rawMatches } = collectMatchesForFingerprint({
                    products,
                    queryFingerprint,
                    threshold,
                });

                return responseReturn(res, 200, {
                    matches: groupedMatches.slice(0, 20),
                    totalMatches: groupedMatches.length,
                    rawMatchCount: rawMatches.length,
                    queryFingerprint,
                    threshold,
                });
            } catch (error) {
                console.error('customer product_image_search error:', error);
                return responseReturn(res, 500, { error: 'Failed to search similar product images' });
            } finally {
                if (temporaryPublicId) {
                    try {
                        await cloudinary.uploader.destroy(temporaryPublicId);
                    } catch (cleanupError) {
                        console.error('Failed to clean up temporary search image:', cleanupError.message);
                    }
                }
            }
        });
    }

}

export default new homeControllers();