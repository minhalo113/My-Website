import formidable from 'formidable';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import productModel from "../../models/productModel.js";
import categoryModel from "../../models/categoryModel.js";
import responseReturn from "../../utils/response.js";
import { fingerprintFromUploadResult } from "../../utils/imageFingerprint.js";
import { searchCatalogProducts } from "../../services/productSearchService.js";
import { computeEffectivePrice } from "../../utils/effectivePrice.js";
import {
    fetchProductsForImageSearch,
    collectMatchesForFingerprint,
} from "../../utils/productImageSearch.js";
import { formatReviewForResponse, formatReviewListForResponse, repositionReviewInPlace } from "../../utils/reviewFormatter.js";
import {
    buildStoredReviewImage,
    getReviewImageIdentifier,
    getReviewImagePublicId,
    getReviewImageResourceType,
    getReviewImageUrl,
} from "../../utils/reviewImageUtils.js";

const { Types } = mongoose;

class homeControllers {
    formateProduct = (products) => {
        const productArray = [];
        let i = 0;
        while (i < products.length) {
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

    get_category = async (req, res) => {
        const { page, searchValue, parPage } = req.query

        try {
            let skipPage = ''
            if (parPage && page) {
                skipPage = parseInt(parPage) * (parseInt(page) - 1)
            }

            if (searchValue && page && parPage) {
                const categorys = await categoryModel.find({
                    $text: { $search: searchValue }
                }).skip(skipPage).limit(parPage).sort({ createdAt: -1 })

                const totalCategory = await categoryModel.find({
                    $text: { $search: searchValue }
                }).countDocuments()
                return responseReturn(res, 200, { categorys, totalCategory })
            } else if (searchValue === '' && page && parPage) {
                const categorys = await categoryModel.find({}).skip(skipPage).limit(parPage).sort({ createdAt: -1 })
                const totalCategory = await categoryModel.find({}).countDocuments()
                return responseReturn(res, 200, { categorys, totalCategory })
            }
            else {
                const categorys = await categoryModel.find({}).sort({ createdAt: -1 })
                const totalCategory = await categoryModel.find({}).countDocuments()
                return responseReturn(res, 200, { categorys, totalCategory })
            }

        } catch (error) {
            console.log(error)
            return responseReturn(res, 500, { error: "Internal Server Error" })
        }
    }

    featured_categories = async (req, res) => {
        const rawLimit = parseInt(req.query.limit, 10);
        const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 24) : 6;

        try {
            const pipeline = [
                { $match: { isHidden: false } },
                { $sort: { createdAt: -1, _id: -1 } },
                {
                    $group: {
                        _id: '$category',
                        product: { $first: '$$ROOT' },
                        createdAt: { $first: '$createdAt' },
                    },
                },
                { $sort: { createdAt: -1, _id: 1 } },
                { $limit: limit },
            ];

            const results = await productModel.aggregate(pipeline);
            const categories = results.map((entry) => {
                const product = entry.product || {};
                const images = Array.isArray(product.images) ? product.images : [];
                return {
                    category: entry._id,
                    productId: product._id,
                    image: images[0] || null,
                };
            });

            return responseReturn(res, 200, { categories });
        } catch (error) {
            console.log(error);
            return responseReturn(res, 500, { error: "Internal Server Error" });
        }
    }

    products_get = async (req, res) => {
        const { page, searchValue, parPage, category, minPrice, maxPrice, sort, type } = req.query

        // Map public type names to internal productType values
        let mappedType = type;
        if (type === 'direct') mappedType = 'standard';
        if (type === 'global-finds') mappedType = 'affiliate';

        const trimmedSearch = typeof searchValue === 'string' ? searchValue.trim() : ''
        const hasPriceFilter = minPrice !== undefined || maxPrice !== undefined
        const hasSort = typeof sort === 'string' && sort.trim() !== ''
        const shouldUseSearchServie = Boolean(trimmedSearch) || (page && parPage) || (category && category !== 'all') || hasPriceFilter || hasSort

        if (shouldUseSearchServie) {
            try {
                const searchResponse = await searchCatalogProducts({
                    term: trimmedSearch,
                    category,
                    productType: mappedType,
                    page,
                    limit: parPage,
                    includeFacets: Boolean(trimmedSearch),
                    includeSuggestions: Boolean(trimmedSearch),
                    minPrice,
                    maxPrice,
                    sort,
                })

                const payload = {
                    products: searchResponse.results,
                    totalProduct: searchResponse.total,
                    page: searchResponse.page,
                    parPage: searchResponse.perPage,
                }

                if (searchResponse.facets) {
                    payload.facets = searchResponse.facets
                }

                if (Array.isArray(searchResponse.suggestions)) {
                    payload.suggestions = searchResponse.suggestions
                }

                if (searchResponse.metrics) {
                    payload.metrics = searchResponse.metrics
                }
                if (searchResponse.filters) {
                    payload.filters = searchResponse.filters
                }
                return responseReturn(res, 200, payload)
            } catch (error) {
                console.log(error)
                return responseReturn(res, 500, { error: "Unable to load products right now." })
            }
        }

        try {
            const matchQuery = { isHidden: false }
            if (mappedType && ['standard', 'affiliate'].includes(mappedType)) {
                matchQuery.productType = mappedType
            }
            const products = await productModel.find(matchQuery)
                .select('_id name slug category images price discount rating averageRating reviewCount colors colorPrices sizes colorImages seller createdAt brand productType affiliateLink link')
                .sort({ createdAt: -1 })

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
            const totalProduct = await productModel.countDocuments(matchQuery)

            return responseReturn(res, 200, { products: normalizedProducts, totalProduct })
        } catch (error) {
            return responseReturn(res, 500, { error: error.message })
        }
    }

    products_search = async (req, res) => {
        const { q, searchValue, page, limit, parPage, category, minPrice, maxPrice } = req.query

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

        try {
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
        } catch (error) {
            console.log(error)
            return responseReturn(res, 500, { error: 'Unable to search products right now' })
        }
    }

    product_get = async (req, res) => {
        const { productId } = req.params;
        try {
            const product = await productModel.findOne({ _id: productId, isHidden: false }).lean()
            if (!product) {
                return responseReturn(res, 404, { error: 'Product not found' })
            }
            const sanitizedProduct = {
                ...product,
                ratings: formatReviewListForResponse(product?.ratings || []),
            }
            return responseReturn(res, 200, { product: sanitizedProduct })
        } catch (error) {
            return responseReturn(res, 500, { error: error.message })
        }
    }

    rate_product = async (req, res) => {
        const contentType = req.headers['content-type'] || '';
        const isMultipart = typeof contentType === 'string' && contentType.includes('multipart/form-data');

        let fields = {};
        let files = {};

        if (isMultipart) {
            const form = formidable({ multiples: true, keepExtensions: true });
            try {
                const parsed = await new Promise((resolve, reject) => {
                    form.parse(req, (err, parsedFields, parsedFiles) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({
                                fields: parsedFields || {},
                                files: parsedFiles || {},
                            });
                        }
                    });
                });
                fields = parsed.fields || {};
                files = parsed.files || {};
            } catch (error) {
                console.log(error);
                return responseReturn(res, 400, {
                    message: 'Unable to process review form data.',
                    error: error?.message || 'Unable to process review form data.',
                });
            }
        } else {
            fields = req.body || {};
        }

        const resolveFieldValue = (value) => {
            if (Array.isArray(value)) {
                return value.length ? resolveFieldValue(value[0]) : '';
            }
            if (value === undefined || value === null) return '';
            return String(value);
        };

        const parseKeepList = (value) => {
            const normalized = typeof value === 'string' ? value.trim() : '';
            if (!normalized) return [];
            try {
                const parsed = JSON.parse(normalized);
                if (Array.isArray(parsed)) {
                    return parsed
                        .map((item) => {
                            if (typeof item === 'string') return item.trim();
                            if (item === undefined || item === null) return '';
                            return String(item).trim();
                        })
                        .filter(Boolean);
                }
            } catch (error) {
                // ignore malformed JSON payloads
            }
            return [];
        };

        const ratingValue = Number(resolveFieldValue(fields.rating ?? fields.star ?? fields.score));
        if (!Number.isFinite(ratingValue) || ratingValue < 1 || ratingValue > 5) {
            return responseReturn(res, 400, { message: 'Rating must be between 1 and 5 stars.' });
        }

        const commentValue = resolveFieldValue(fields.comment ?? fields.review ?? fields.message);
        const trimmedComment = commentValue.trim();

        const keepImageKeys = isMultipart
            ? parseKeepList(resolveFieldValue(fields.keepImageKeys ?? fields.keepImagePublicIds ?? fields.retainImageKeys))
            : null;

        const fileUploads = isMultipart
            ? (() => {
                const collected = [];
                const fileKeys = ['images', 'image', 'reviewImages', 'reviewImage', 'files'];
                fileKeys.forEach((key) => {
                    const entry = files[key];
                    if (!entry) return;
                    const list = Array.isArray(entry) ? entry : [entry];
                    list.forEach((file) => {
                        if (!file) return;
                        const filepath = file.filepath || file.path;
                        if (!filepath) return;
                        if (typeof file.size === 'number' && file.size === 0) return;
                        collected.push(file);
                    });
                });
                return collected;
            })()
            : [];

        const product = await productModel.findById(req.params.productId);
        if (!product) {
            return responseReturn(res, 404, { message: 'Product not found' });
        }

        const userId = req.user.id.toString();
        const curUser = req.user;

        const existing = product.ratings.find((r) => {
            try {
                return r.user && r.user.toString() === userId;
            } catch (error) {
                return false;
            }
        });

        const ensureCloudinaryConfigured = (() => {
            let configured = false;
            return () => {
                if (configured) return;
                cloudinary.config({
                    cloud_name: process.env.cloud_name,
                    api_key: process.env.api_key,
                    api_secret: process.env.api_secret,
                    secure: true,
                });
                configured = true;
            };
        })();

        const uploadedImageRecords = [];
        const uploadedAssetRefs = [];
        const removedAssets = [];

        const keepSet = Array.isArray(keepImageKeys)
            ? new Set(keepImageKeys.map((key) => (typeof key === 'string' ? key.trim() : '')).filter(Boolean))
            : null;

        const now = new Date();

        try {
            if (fileUploads.length) {
                ensureCloudinaryConfigured();
                for (const file of fileUploads) {
                    if (!file) continue;
                    const uploadInput = file.filepath || file.path;
                    if (!uploadInput) continue;
                    try {
                        const uploadResult = await cloudinary.uploader.upload(uploadInput, {
                            folder: 'products/reviews/gallery',
                        });
                        const storedImage = buildStoredReviewImage(uploadResult);
                        if (storedImage) {
                            uploadedImageRecords.push(storedImage);
                            if (storedImage.public_id) {
                                uploadedAssetRefs.push({
                                    publicId: storedImage.public_id,
                                    resourceType: storedImage.resource_type || 'image',
                                });
                            }
                        }
                    } catch (uploadError) {
                        console.error('Failed to upload review image:', uploadError?.message || uploadError);
                        throw uploadError;
                    }
                }
            }

            let targetReview = null;
            if (existing) {
                const existingImages = Array.isArray(existing.images) ? existing.images : [];
                let retainedImages = existingImages;

                if (keepSet !== null) {
                    retainedImages = [];
                    existingImages.forEach((image) => {
                        const identifier = getReviewImageIdentifier(image);
                        if (identifier && keepSet.has(identifier)) {
                            retainedImages.push(image);
                        } else {
                            const publicId = getReviewImagePublicId(image);
                            if (publicId) {
                                removedAssets.push({
                                    publicId,
                                    resourceType: getReviewImageResourceType(image),
                                });
                            }
                        }
                    });
                } else {
                    retainedImages = [...existingImages];
                }

                const imagesForReview = [...retainedImages, ...uploadedImageRecords];
                const previousComment = typeof existing.comment === 'string' ? existing.comment : '';
                const previousRating = Number(existing.rating) || 0;
                const commentChanged = previousComment !== trimmedComment;
                const ratingChanged = previousRating !== ratingValue;
                const imagesChanged = (keepSet !== null && retainedImages.length !== existingImages.length)
                    || uploadedImageRecords.length > 0;

                existing.rating = ratingValue;
                existing.comment = trimmedComment;
                existing.images = imagesForReview;
                existing.updatedAt = now;
                existing.isEdited = existing.isEdited || commentChanged || ratingChanged || imagesChanged;
                existing.userImage = curUser.image;
                if (!existing.reviewDate) {
                    existing.reviewDate = existing.createdAt || now;
                }
                if (!existing.createdAt) {
                    existing.createdAt = now;
                }
                targetReview = existing;
            } else {
                const reviewPayload = {
                    user: userId,
                    rating: ratingValue,
                    comment: trimmedComment,
                    images: uploadedImageRecords,
                    name: curUser.name,
                    userImage: curUser.image,
                    reviewDate: now,
                    createdAt: now,
                    updatedAt: now,
                    isEdited: false,
                };
                product.ratings.push(reviewPayload);
                targetReview = product.ratings[product.ratings.length - 1];
            }

            if (targetReview) {
                repositionReviewInPlace(product.ratings, targetReview);
            }

            product.markModified('ratings');
            if (product.ratings.length > 0) {
                const total = product.ratings.reduce((acc, review) => acc + Number(review.rating || 0), 0);
                product.averageRating = Math.round((total / product.ratings.length) * 10) / 10;
            } else {
                product.averageRating = 0;
            }

            product.reviewCount = product.ratings.length;
            await product.save();

            if (removedAssets.length) {
                ensureCloudinaryConfigured();
                await Promise.all(
                    removedAssets.map(async ({ publicId, resourceType }) => {
                        if (!publicId) return;
                        const options = {
                            invalidate: true,
                            ...(resourceType && resourceType !== 'image' ? { resource_type: resourceType } : {}),
                        };
                        try {
                            await cloudinary.uploader.destroy(publicId, options);
                        } catch (destroyError) {
                            console.error('Failed to destroy review asset:', destroyError?.message || destroyError);
                        }
                    })
                );
            }

            return responseReturn(res, 200, {
                message: 'Rating saved',
                averageRating: product.averageRating,
            });
        } catch (error) {
            if (uploadedAssetRefs.length) {
                try {
                    ensureCloudinaryConfigured();
                    await Promise.all(
                        uploadedAssetRefs.map(async ({ publicId, resourceType }) => {
                            if (!publicId) return;
                            const options = {
                                invalidate: true,
                                ...(resourceType && resourceType !== 'image' ? { resource_type: resourceType } : {}),
                            };
                            try {
                                await cloudinary.uploader.destroy(publicId, options);
                            } catch (cleanupError) {
                                console.error('Failed to clean up review upload:', cleanupError?.message || cleanupError);
                            }
                        })
                    );
                } catch (configError) {
                    console.error('Cloudinary cleanup configuration error:', configError?.message || configError);
                }
            }
            console.log(error);
            return responseReturn(res, 500, { message: error.message || 'Failed to save review.' });
        }
    }

    get_my_product_review = async (req, res) => {
        const { productId } = req.params;
        try {
            const product = await productModel.findById(productId).select('ratings');
            if (!product) {
                return responseReturn(res, 404, { message: 'Product not found.' });
            }

            const userId = req.user.id.toString();
            const review = product.ratings.find((item) => {
                try {
                    return item.user && item.user.toString() === userId;
                } catch (error) {
                    return false;
                }
            });

            if (!review) {
                return responseReturn(res, 200, { review: null });
            }

            const plainReview = typeof review.toObject === 'function' ? review.toObject() : review;
            const images = Array.isArray(plainReview.images)
                ? plainReview.images
                    .map((image, index) => {
                        const url = getReviewImageUrl(image);
                        if (!url) return null;
                        return {
                            url,
                            identifier: getReviewImageIdentifier(image) || `image-${index}`,
                            publicId: getReviewImagePublicId(image) || null,
                            resourceType: getReviewImageResourceType(image) || 'image',
                        };
                    })
                    .filter(Boolean)
                : [];

            return responseReturn(res, 200, {
                review: {
                    _id: plainReview._id,
                    rating: plainReview.rating ?? 0,
                    comment: plainReview.comment || '',
                    images,
                    reviewDate: plainReview.reviewDate || plainReview.createdAt || null,
                    createdAt: plainReview.createdAt || null,
                    updatedAt: plainReview.updatedAt || null,
                    isEdited: Boolean(plainReview.isEdited),
                },
            });
        } catch (error) {
            console.log(error);
            return responseReturn(res, 500, { message: error.message || 'Failed to load review.' });
        }
    }

    get_reviews = async (req, res) => {
        const { productId } = req.params;
        const limitParam = Number.parseInt(req.query.limit, 10);
        const pageParam = Number.parseInt(req.query.page, 10);
        const limit = Math.min(Math.max(Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 10, 1), 100);
        const page = Math.max(Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1, 1);
        const skip = (page - 1) * limit;

        if (!Types.ObjectId.isValid(productId)) {
            return responseReturn(res, 400, { message: 'Invalid product identifier.' });
        }

        try {
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
        } catch (error) {
            console.log(error)
            return responseReturn(res, 500, { message: error.message })
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
