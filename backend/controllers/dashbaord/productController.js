import formidable from "formidable";
import responseReturn from "../../utils/response.js";
import { v2 as cloudinary } from 'cloudinary';
import productModel from "../../models/productModel.js";
import parseColorPrices from '../../utils/parseColorPrices.js';
import { computeEffectivePrice } from '../../utils/effectivePrice.js';
import extractSkuImagesAndPrices from '../../utils/extractSkuImagesAndPrices.js';
import { generateProductSocialCopy } from '../../services/aiProductSocialService.js';
import { publishProductSocialPost } from '../../services/metaPublisher.js';
import AliExpressProvider from '../../services/ingestion/providers/AliExpressProvider.js';
import { generateSlug } from '../../utils/slugUtils.js';
import {
    extractPublicId,
    fingerprintFromUploadResult,
} from '../../utils/imageFingerprint.js';
import {
    buildStoredReviewImage,
    getReviewImagePublicId,
    getReviewImageResourceType,
} from '../../utils/reviewImageUtils.js';
import {
    fetchProductsForImageSearch,
    collectMatchesForFingerprint,
} from '../../utils/productImageSearch.js';
import {
    formatReviewForResponse,
    formatReviewListForResponse,
    repositionReviewInPlace,
} from '../../utils/reviewFormatter.js';
import ingestionService from '../../services/ingestion/IngestionService.js';
import { searchCatalogProducts } from "../../services/productSearchService.js";

const normalizeUploadList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.filter(Boolean);
    }
    return value ? [value] : [];
}


const computeAverageRatingValue = (ratings = []) => {
    if (!Array.isArray(ratings) || ratings.length === 0) {
        return 0;
    }
    const total = ratings.reduce((sum, review) => {
        const numeric = Number(review?.rating);
        return sum + (Number.isFinite(numeric) ? numeric : 0);
    }, 0);
    return Math.round((total / ratings.length) * 10) / 10;
};

const parseSocialTags = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value
            .map((item) => parseSocialTags(item))
            .flat()
            .filter(Boolean);
    }
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parseSocialTags(parsed);
            }
        } catch (error) {
            // ignore JSON parse errors for plain string lists
        }
        return value
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }
    return [];
};

const pickFirstValue = (value) => (Array.isArray(value) ? value[0] : value);
const sanitizeStringField = (value) => {
    const resolved = pickFirstValue(value);
    return typeof resolved === 'string' ? resolved.trim() : '';
};

const parseDateField = (value) => {
    const normalized = sanitizeStringField(value);
    if (!normalized) return null;
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

class productController {
    canManageProduct(product, req) {
        if (!product || !req) return false;
        if (req.role === 'admin') {
            return true;
        }
        // const sellerId = product.sellerId ? product.sellerId.toString() : null;
        // const requesterId = req.id ? req.id.toString() : null;
        // return Boolean(sellerId && requesterId && sellerId === requesterId);
        return false;
    }

    checkDuplicateLink = async (link, excludeId = null) => {
        const trimmed = String(link).trim();
        if (!trimmed) {
            return null;
        }
        const query = { link: trimmed };
        if (excludeId) {
            query._id = { $ne: excludeId };
        }
        return await productModel.findOne(query);
    }

    add_product = async (req, res) => {
        const { id } = req;
        const form = formidable({ multiples: true });

        form.parse(req, async (err, field, files) => {
            let { name, category, description, stock, price, discount, deliveryTime, shopName, brand, colors, sizes, colorPrices, link, affiliateLink, productType, shippingDestination } = field;

            shopName = String(shopName).trim()

            let { images, colorImages, videos } = files;

            name = String(name).trim()
            const slug = generateSlug(name)

            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true
            })

            try {
                if (link && String(link).trim()) {
                    const duplicate = await this.checkDuplicateLink(link);

                    if (duplicate) {
                        return responseReturn(res, 409, { error: 'Product link already exists' })
                    }
                }

                const colorArr = colors ? String(colors).split(',').map(c => c.trim()).filter(Boolean) : []

                if (colorArr.length !== (files.colorImages ? (Array.isArray(files.colorImages) ? files.colorImages.length : 1) : 0)) {
                    return responseReturn(res, 400, { error: 'Number of colors and color images must match' })
                }

                let allImageUrl = [];
                let imageFingerprints = [];
                let allColorImageUrl = [];
                let colorImageFingerprints = [];

                let allVideoUrl = [];
                if (!Array.isArray(images)) {
                    images = [images]
                }
                if (colorImages && !Array.isArray(colorImages)) {
                    colorImages = [colorImages]
                }

                if (videos && !Array.isArray(videos)) {
                    videos = [videos]
                }

                for (let i = 0; i < images.length; ++i) {
                    const result = await cloudinary.uploader.upload(images[i].filepath, { folder: 'products', phash: true });
                    const url = result.secure_url || result.url;
                    allImageUrl.push(url);
                    imageFingerprints.push(fingerprintFromUploadResult(result) || '');
                }

                if (colorImages) {
                    for (let i = 0; i < colorImages.length; ++i) {
                        const result = await cloudinary.uploader.upload(colorImages[i].filepath, { folder: 'products/colors', phash: true });
                        const url = result.secure_url || result.url;
                        allColorImageUrl.push(url);
                        colorImageFingerprints.push(fingerprintFromUploadResult(result) || '');
                    }
                }

                if (videos) {
                    for (let i = 0; i < videos.length; ++i) {
                        const result = await cloudinary.uploader.upload(videos[i].filepath, { folder: 'products/videos', resource_type: 'video' });
                        allVideoUrl.push(result.url)
                    }
                }

                const parsedColorPrices = parseColorPrices(colorPrices);
                const effectivePrice = computeEffectivePrice({
                    price: parseInt(price),
                    colorPrices: parsedColorPrices,
                    discount: parseInt(discount)
                });

                await productModel.create({
                    sellerId: id,
                    name,
                    slug,
                    shopName,
                    category: String(category).trim(),
                    description: String(description).trim(),
                    stock: parseInt(stock),
                    price: parseInt(price),
                    effectivePrice,
                    discount: parseInt(discount),
                    deliveryTime: deliveryTime ? String(deliveryTime).trim() : '',
                    images: allImageUrl,
                    imageFingerprints,
                    videos: allVideoUrl,
                    brand: String(brand).trim(),
                    link: link ? String(link).trim() : '',
                    affiliateLink: affiliateLink ? String(affiliateLink).trim() : '',
                    productType: productType ? String(productType).trim() : 'standard',
                    colors: colorArr,
                    sizes: sizes ? String(sizes).split(',').map(c => c.trim()).filter(Boolean) : [],
                    colorImages: allColorImageUrl,
                    colorImageFingerprints,
                    colorPrices: parsedColorPrices,
                    shippingDestination: shippingDestination ? String(shippingDestination).trim() : 'both'
                })
                return responseReturn(res, 201, { message: "Product Added Successfully" })
            } catch (error) {
                console.log(error.message)
                return responseReturn(res, 500, { error: error.message })
            }
        })
    }

    products_get = async (req, res) => {
        const { page, searchValue, parPage, minPrice, maxPrice, category, type } = req.query;

        try {

            const searchResponse = await searchCatalogProducts({
                term: searchValue,
                page,
                limit: parPage,
                minPrice,
                maxPrice,
                category,
                productType: type,
                includeFacets: false,
                includeSuggestions: false,
                includeHidden: true
            });

            return responseReturn(res, 200, {
                products: searchResponse.results,
                totalProduct: searchResponse.total
            });

        } catch (error) {
            console.log(error);
            return responseReturn(res, 500, { error: error.message });
        }
    }

    product_get = async (req, res) => {
        const { productId } = req.params;
        try {
            const product = await productModel.findById(productId)
            return responseReturn(res, 200, { product })
        } catch (error) {
            return responseReturn(res, 500, { error: error.message })
        }
    }

    product_update = async (req, res) => {
        let { name, description, stock, price, category, discount, deliveryTime, brand, colors, sizes, colorPrices, productId, link, affiliateLink, productType, shippingDestination } = req.body;

        name = String(name).trim()
        const slug = generateSlug(name)

        const colorArr = colors ? String(colors).split(',').map(c => c.trim()).filter(Boolean) : []
        const sizeArr = sizes ? String(sizes).split(',').map(s => s.trim()).filter(Boolean) : []

        try {
            const product = await productModel.findById(productId)
            if (!product) {
                return responseReturn(res, 404, { error: 'Product not found' })
            }
            if (!this.canManageProduct(product, req)) {
                return responseReturn(res, 403, { error: 'You are not authorized to update this product' });
            }
            if (colorArr.length !== (product.colorImages ? product.colorImages.length : 0)) {
                return responseReturn(res, 400, { error: 'Number of colors and color images must match' })
            }

            if (link && String(link).trim()) {
                const duplicate = await this.checkDuplicateLink(link, productId);
                if (duplicate) {
                    return responseReturn(res, 409, { error: 'Product link already exists' })
                }
            }

            const parsedColorPrices = parseColorPrices(colorPrices);
            const effectivePrice = computeEffectivePrice({
                price: parseInt(price),
                colorPrices: parsedColorPrices,
                discount: parseInt(discount)
            });

            await productModel.findByIdAndUpdate(productId, {
                name, description, stock, price, effectivePrice, category, discount, deliveryTime, brand, shippingDestination,
                link: link ? String(link).trim() : '',
                affiliateLink: affiliateLink ? String(affiliateLink).trim() : '',
                productType: productType ? String(productType).trim() : 'standard',
                colors: colorArr,
                colorPrices: parsedColorPrices,
                productId, slug
            })
            const updatedProduct = await productModel.findById(productId)
            return responseReturn(res, 200, { product: updatedProduct, message: "Product Updated Successfully" })
        } catch (error) {
            return responseReturn(res, 500, { error: error.message })
        }
    }

    product_image_update = async (req, res) => {
        const form = formidable({
            multiples: true,
            keepExtensions: true,
            allowEmptyFiles: false,
        });

        form.parse(req, async (err, fields, files) => {
            if (err) return responseReturn(res, 400, { error: err.message });

            const { oldImage = '', productId, imageType, action } = fields;
            const _oldImage = Array.isArray(oldImage) ? oldImage[0] : oldImage;
            const _productId = Array.isArray(productId) ? productId[0] : productId;
            const _imageType = Array.isArray(imageType) ? imageType[0] : imageType;
            const _action = Array.isArray(action) ? action[0] : action;

            const newImageFiles = Array.isArray(files.newImage)
                ? files.newImage
                : files.newImage
                    ? [files.newImage]
                    : [];

            const normalizeArray = (value) => (Array.isArray(value) ? [...value] : []);
            const removeByValue = (imagesArr = [], fingerprintsArr = [], target) => {
                const images = normalizeArray(imagesArr);
                const fingerprints = normalizeArray(fingerprintsArr);
                const updatedImages = [];
                const updatedFingerprints = [];
                let removed = false;
                images.forEach((img, idx) => {
                    if (!removed && target && img === target) {
                        removed = true;
                        return;
                    }
                    updatedImages.push(img);
                    const fp = fingerprints[idx] || '';
                    updatedFingerprints.push(fp);
                });
                return { images: updatedImages, fingerprints: updatedFingerprints };
            };
            const upsertValue = (imagesArr = [], fingerprintsArr = [], oldValue, newValue, fingerprintValue) => {
                const images = normalizeArray(imagesArr);
                const fingerprints = normalizeArray(fingerprintsArr);
                const fingerprint = fingerprintValue || '';
                if (oldValue) {
                    const index = images.findIndex((img) => img === oldValue);
                    if (index > -1) {
                        images[index] = newValue;
                        if (fingerprints.length > index) {
                            fingerprints[index] = fingerprint;
                        } else {
                            while (fingerprints.length < index) fingerprints.push('');
                            fingerprints[index] = fingerprint;
                        }
                        return { images, fingerprints };
                    }
                }
                images.push(newValue);
                fingerprints.push(fingerprint);
                return { images, fingerprints };
            };

            try {
                cloudinary.config({
                    cloud_name: process.env.cloud_name,
                    api_key: process.env.api_key,
                    api_secret: process.env.api_secret,
                    secure: true,
                });

                const product = await productModel.findById(_productId);
                if (!product) {
                    return responseReturn(res, 404, { error: 'Product not found' });
                }
                if (!this.canManageProduct(product, req)) {
                    return responseReturn(res, 403, { error: 'You are not authorized to update this product images' });
                }

                if (_action === 'delete') {
                    let updateField = {};
                    if (_imageType === 'color') {
                        const { images, fingerprints } = removeByValue(product.colorImages, product.colorImageFingerprints, _oldImage);
                        updateField = { colorImages: images, colorImageFingerprints: fingerprints };
                        const publicId = extractPublicId(_oldImage);
                        if (publicId) {
                            await cloudinary.uploader.destroy(publicId);
                        }
                    } else if (_imageType === 'video') {
                        const videos = normalizeArray(product.videos).filter((v) => v !== _oldImage);
                        updateField = { videos };
                        const publicId = extractPublicId(_oldImage);
                        if (publicId) {
                            await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
                        }
                    } else {
                        const { images, fingerprints } = removeByValue(product.images, product.imageFingerprints, _oldImage);
                        updateField = { images, imageFingerprints: fingerprints };
                        const publicId = extractPublicId(_oldImage);
                        if (publicId) {
                            await cloudinary.uploader.destroy(publicId);
                        }
                    }

                    const updatedProduct = await productModel.findByIdAndUpdate(_productId, updateField, { new: true });
                    const msg = _imageType === 'video'
                        ? 'Product Video Deleted Successfully'
                        : 'Product Image Deleted Successfully';
                    return responseReturn(res, 200, { product: updatedProduct, message: msg });
                }

                if (!newImageFiles.length) {
                    return responseReturn(res, 400, { error: 'No file uploaded' });
                }

                const isVideo = _imageType === 'video';
                const folder =
                    _imageType === 'color' ? 'products/colors' :
                        isVideo ? 'products/videos' :
                            'products';

                const uploadOpts = isVideo
                    ? { folder, resource_type: 'video' }
                    : { folder, phash: true };

                const file = newImageFiles[0];
                const localPath = file.filepath || file.path;
                const result = await cloudinary.uploader.upload(localPath, uploadOpts);

                if (!result) {
                    return responseReturn(res, 404, { error: 'Image Upload Failed' });
                }

                const url = result.secure_url || result.url;
                let updateField = {};

                if (_imageType === 'color') {
                    const { images, fingerprints } = upsertValue(
                        product.colorImages,
                        product.colorImageFingerprints,
                        _oldImage,
                        url,
                        fingerprintFromUploadResult(result)
                    );
                    updateField = { colorImages: images, colorImageFingerprints: fingerprints };
                } else if (isVideo) {
                    const videos = normalizeArray(product.videos);
                    if (_oldImage) {
                        const index = videos.findIndex((v) => v === _oldImage);
                        if (index > -1) {
                            videos[index] = url;
                        } else {
                            videos.push(url);
                        }
                    } else {
                        videos.push(url);
                    }
                    updateField = { videos };
                } else {
                    const { images, fingerprints } = upsertValue(
                        product.images,
                        product.imageFingerprints,
                        _oldImage,
                        url,
                        fingerprintFromUploadResult(result)
                    );
                    updateField = { images, imageFingerprints: fingerprints };
                }

                await productModel.findByIdAndUpdate(_productId, updateField);
                const productAfterUpdate = await productModel.findById(_productId);
                const message = isVideo
                    ? (_oldImage ? 'Product Video Updated Successfully' : 'Product Video Added Successfully')
                    : (_oldImage ? 'Product Image Updated Successfully' : 'Product Image Added Successfully');

                return responseReturn(res, 200, { product: productAfterUpdate, message });
            } catch (error) {
                console.error('product_image_update error:', error);
                return responseReturn(res, 500, { error: 'Image Upload Failed' });
            }
        });
    };

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
                });
            } catch (error) {
                console.error('product_image_search error:', error);
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

    product_image_batch_check = async (req, res) => {
        const form = formidable({
            multiples: true,
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

            const primaryUploads = normalizeUploadList(files.images);
            const colorUploads = normalizeUploadList(files.colorImages);
            const queries = [];

            primaryUploads.forEach((file, index) => {
                if (file) {
                    queries.push({ file, sourceType: 'primary', sourceIndex: index });
                }
            });

            colorUploads.forEach((file, index) => {
                if (file) {
                    queries.push({ file, sourceType: 'color', sourceIndex: index });
                }
            });

            if (!queries.length) {
                return responseReturn(res, 400, { error: 'At least one image is required for duplicate checking' });
            }

            const temporaryUploads = [];
            const processedQueries = [];

            const resolveFilename = (file) =>
                file?.originalFilename || file?.newFilename || file?.filepath?.split?.('/')?.pop() || 'image';

            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true,
            });

            try {
                for (const query of queries) {
                    const { file } = query;
                    const responseData = {
                        ...query,
                        filename: resolveFilename(file),
                        queryFingerprint: null,
                        error: null,
                    };

                    try {
                        const uploadResult = await cloudinary.uploader.upload(file.filepath || file.path, {
                            folder: 'products/search-temp',
                            phash: true,
                        });
                        if (uploadResult?.public_id) {
                            temporaryUploads.push(uploadResult.public_id);
                        }
                        const queryFingerprint = fingerprintFromUploadResult(uploadResult);
                        if (!queryFingerprint) {
                            responseData.error = 'Unable to generate fingerprint for this image';
                        } else {
                            responseData.queryFingerprint = queryFingerprint;
                        }
                    } catch (uploadError) {
                        responseData.error = uploadError?.message || 'Failed to analyze image';
                    }

                    processedQueries.push(responseData);
                }

                const successfulQueries = processedQueries.filter((item) => item.queryFingerprint).length;
                let products = [];

                if (successfulQueries) {
                    products = await fetchProductsForImageSearch();
                }

                const results = processedQueries.map((item) => {
                    if (!item.queryFingerprint) {
                        return {
                            sourceType: item.sourceType,
                            sourceIndex: item.sourceIndex,
                            filename: item.filename,
                            matches: [],
                            totalMatches: 0,
                            queryFingerprint: null,
                            error: item.error || 'Unable to analyze this image',
                        };
                    }

                    const { groupedMatches, rawMatches } = collectMatchesForFingerprint({
                        products,
                        queryFingerprint: item.queryFingerprint,
                        threshold,
                    });

                    return {
                        sourceType: item.sourceType,
                        sourceIndex: item.sourceIndex,
                        filename: item.filename,
                        matches: groupedMatches.slice(0, 15),
                        totalMatches: groupedMatches.length,
                        rawMatchCount: rawMatches.length,
                        queryFingerprint: item.queryFingerprint,
                        error: null,
                    };
                });

                const totalMatches = results.reduce((sum, entry) => sum + (entry.totalMatches || 0), 0);
                const totalRawMatches = results.reduce((sum, entry) => sum + (entry.rawMatchCount || 0), 0);

                return responseReturn(res, 200, {
                    threshold,
                    totalQueries: queries.length,
                    successfulQueries,
                    results,
                    totalMatches,
                    totalRawMatches,
                });
            } catch (error) {
                console.error('product_image_batch_check error:', error);
                return responseReturn(res, 500, { error: 'Failed to check images for duplicates' });
            } finally {
                for (const publicId of temporaryUploads) {
                    if (!publicId) continue;
                    try {
                        await cloudinary.uploader.destroy(publicId);
                    } catch (cleanupError) {
                        console.error('Failed to clean up temporary search image:', cleanupError.message);
                    }
                }
            }
        });
    }

    import_aliexpress_product = async (req, res) => {
        const { url, productId: bodyProductId } = req.body;
        const productId = bodyProductId || (url ? url.match(/(\d+)/)?.[1] : null);
        if (!productId) {
            return responseReturn(res, 400, { error: 'Product ID is required' });
        }

        try {
            const productResp = await AliExpressProvider.getDSProduct(productId, 'CA', 'CAD');
            if (!productResp) {
                return responseReturn(res, 404, { error: 'Product not found on AliExpress' });
            }

            const extracted = extractSkuImagesAndPrices(productResp);
            return res.status(200).json(extracted);
        } catch (error) {
            console.error('import_aliexpress_product error:', error);
            const msg = error.message || 'Failed to import product';
            return responseReturn(res, 500, { error: msg });
        }
    }

    get_product_reviews = async (req, res) => {
        if (req.role !== 'admin') {
            return responseReturn(res, 403, { error: 'Only administrators can manage product reviews.' });
        }

        const { productId } = req.params;
        try {
            const product = await productModel.findById(productId).select('ratings name');
            if (!product) {
                return responseReturn(res, 404, { error: 'Product not found.' });
            }

            const reviews = formatReviewListForResponse(product.ratings || []);

            const averageRating = computeAverageRatingValue(product.ratings);
            const reviewCount = reviews.length;

            return responseReturn(res, 200, {
                product: {
                    _id: typeof product._id?.toString === 'function' ? product._id.toString() : product._id,
                    name: product.name,
                },
                reviews,
                averageRating,
                reviewCount,
            });
        } catch (error) {
            console.error('get_product_reviews error:', error);
            return responseReturn(res, 500, { error: 'Failed to load product reviews.' });
        }
    };

    create_fake_product_review = async (req, res) => {
        if (req.role !== 'admin') {
            return responseReturn(res, 403, { error: 'Only administrators can manage product reviews.' });
        }

        const { productId } = req.params;
        const form = formidable({ multiples: true, keepExtensions: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return responseReturn(res, 400, { error: err.message || 'Unable to process review form data.' });
            }

            const ratingInput = sanitizeStringField(fields.rating);
            const commentInput = sanitizeStringField(fields.comment);
            const nameInput = sanitizeStringField(fields.name);
            const reviewDateInput = sanitizeStringField(fields.reviewDate || fields.date || fields.createdAt);
            const updatedAtInput = sanitizeStringField(fields.updatedAt);
            const isEditedInput = sanitizeStringField(fields.isEdited);
            const normalizedComment = commentInput || '';

            if (!ratingInput) {
                return responseReturn(res, 400, { error: 'Rating is required.' });
            }

            const parsedRating = Number(ratingInput);
            if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
                return responseReturn(res, 400, { error: 'Rating must be a number between 1 and 5.' });
            }

            let product;
            try {
                product = await productModel.findById(productId).select('ratings averageRating reviewCount');
            } catch (lookupError) {
                console.error('create_fake_product_review lookup error:', lookupError);
                return responseReturn(res, 500, { error: 'Failed to add fake review.' });
            }

            if (!product) {
                return responseReturn(res, 404, { error: 'Product not found.' });
            }

            const profileUploads = normalizeUploadList(files.profileImage || files.userImage || files.avatar);
            const profileFile = profileUploads.length ? profileUploads[0] : null;
            const reviewImageUploads = normalizeUploadList(files.reviewImages || files.reviewImage || files.images);

            const requiresUpload = Boolean(profileFile || reviewImageUploads.length);
            if (requiresUpload) {
                cloudinary.config({
                    cloud_name: process.env.cloud_name,
                    api_key: process.env.api_key,
                    api_secret: process.env.api_secret,
                    secure: true,
                });
            }

            const uploadedResources = [];
            const registerUpload = (result) => {
                if (result?.public_id) {
                    uploadedResources.push({
                        id: result.public_id,
                        resource_type: result?.resource_type || 'image',
                    });
                }
                return result;
            };

            const cleanupUploads = async () => {
                if (!uploadedResources.length) return;
                for (const resource of uploadedResources) {
                    try {
                        if (resource.resource_type && resource.resource_type !== 'image') {
                            await cloudinary.uploader.destroy(resource.id, { resource_type: resource.resource_type });
                        } else {
                            await cloudinary.uploader.destroy(resource.id);
                        }
                    } catch (cleanupError) {
                        console.error('Failed to clean up review upload:', cleanupError.message || cleanupError);
                    }
                }
            };

            try {
                let userImage = null;
                if (profileFile) {
                    const uploadResult = registerUpload(
                        await cloudinary.uploader.upload(profileFile.filepath || profileFile.path, {
                            folder: 'products/reviews/profiles',
                        })
                    );

                    const userImageUrl = uploadResult?.secure_url || uploadResult?.url;
                    if (userImageUrl) {
                        userImage = {
                            public_id: uploadResult?.public_id,
                            url: userImageUrl,
                        };
                    }
                }

                const reviewImages = [];
                for (const file of reviewImageUploads) {
                    const uploadResult = registerUpload(
                        await cloudinary.uploader.upload(file.filepath || file.path, {
                            folder: 'products/reviews/gallery',
                        })
                    );

                    const storedImage = buildStoredReviewImage(uploadResult);
                    if (storedImage) {
                        reviewImages.push(storedImage);
                    }
                }

                const parsedReviewDate = parseDateField(reviewDateInput);
                const reviewDate = parsedReviewDate || new Date();
                const createdAt = new Date();
                let updatedAt = parseDateField(updatedAtInput) || createdAt;
                if (updatedAt < createdAt) {
                    updatedAt = createdAt;
                }

                const isEdited = typeof isEditedInput === 'string'
                    ? ['true', '1', 'yes', 'on'].includes(isEditedInput.toLowerCase())
                    : false;

                product.ratings.push({
                    name: nameInput || 'Anonymous',
                    rating: parsedRating,
                    comment: normalizedComment,
                    images: reviewImages,
                    userImage,
                    reviewDate,
                    createdAt,
                    updatedAt,
                    isEdited,
                });
                const insertedReview = product.ratings[product.ratings.length - 1];
                const insertedId = insertedReview?._id ? insertedReview._id.toString() : null;
                product.ratings.sort((a, b) => {
                    const aTime = new Date(a.reviewDate || a.createdAt || a.updatedAt || 0).getTime();
                    const bTime = new Date(b.reviewDate || b.createdAt || b.updatedAt || 0).getTime();
                    if (bTime !== aTime) {
                        return bTime - aTime;
                    }
                    const aId = a?._id ? a._id.toString() : '';
                    const bId = b?._id ? b._id.toString() : '';
                    return bId.localeCompare(aId);
                });
                product.markModified('ratings');

                product.averageRating = computeAverageRatingValue(product.ratings);
                product.reviewCount = product.ratings.length;

                await product.save();
                const persistedReview = insertedId
                    ? product.ratings.id(insertedId) || product.ratings.find((item) => item._id?.toString() === insertedId)
                    : product.ratings[0];

                return responseReturn(res, 201, {
                    message: 'Review added successfully.',
                    review: formatReviewForResponse(persistedReview || insertedReview),
                    averageRating: product.averageRating,
                    reviewCount: product.reviewCount,
                });
            } catch (error) {
                await cleanupUploads();
                console.error('create_fake_product_review error:', error);
                return responseReturn(res, 500, { error: 'Failed to add fake review.' });
            }
        });
    };

    update_product_review = async (req, res) => {
        if (req.role !== 'admin') {
            return responseReturn(res, 403, { error: 'Only administrators can manage product reviews.' });
        }

        const { productId, reviewId } = req.params;
        const { comment, rating } = req.body || {};
        const hasComment = Object.prototype.hasOwnProperty.call(req.body || {}, 'comment');
        const hasRating = Object.prototype.hasOwnProperty.call(req.body || {}, 'rating');

        const trimmedComment = hasComment && typeof comment === 'string' ? comment.trim() : undefined;
        if (hasComment && (!trimmedComment || trimmedComment.length === 0)) {
            return responseReturn(res, 400, { error: 'Comment message cannot be empty.' });
        }

        let normalizedRating;
        if (hasRating) {
            const parsed = Number(rating);
            if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) {
                return responseReturn(res, 400, { error: 'Rating must be a number between 1 and 5.' });
            }
            normalizedRating = parsed;
        }

        if (!hasComment && !hasRating) {
            return responseReturn(res, 400, { error: 'No review changes were provided.' });
        }

        try {
            const product = await productModel.findById(productId).select('ratings');
            if (!product) {
                return responseReturn(res, 404, { error: 'Product not found.' });
            }

            const review = product.ratings.id(reviewId) || product.ratings.find((item) => item._id.toString() === reviewId);
            if (!review) {
                return responseReturn(res, 404, { error: 'Review not found.' });
            }

            let changed = false;

            if (hasComment && trimmedComment !== review.comment) {
                review.comment = trimmedComment;
                review.isEdited = true;
                changed = true;
            }

            if (hasRating && normalizedRating !== review.rating) {
                review.rating = normalizedRating;
                review.isEdited = true;
                changed = true;
            }

            if (!review.createdAt) {
                review.createdAt = new Date();
            }

            if (!changed) {
                return responseReturn(res, 200, {
                    message: 'No changes were applied.',
                    review: formatReviewForResponse(review),
                    averageRating: computeAverageRatingValue(product.ratings),
                    reviewCount: product.ratings.length,
                });
            }

            review.updatedAt = new Date();
            repositionReviewInPlace(product.ratings, review);
            product.markModified('ratings');

            product.averageRating = computeAverageRatingValue(product.ratings);
            product.reviewCount = product.ratings.length;
            await product.save();

            return responseReturn(res, 200, {
                message: 'Review updated successfully.',
                review: formatReviewForResponse(review),
                averageRating: product.averageRating,
                reviewCount: product.reviewCount,
            });
        } catch (error) {
            console.error('update_product_review error:', error);
            return responseReturn(res, 500, { error: 'Failed to update review.' });
        }
    };

    delete_product_review = async (req, res) => {
        if (req.role !== 'admin') {
            return responseReturn(res, 403, { error: 'Only administrators can manage product reviews.' });
        }

        const { productId, reviewId } = req.params;
        try {
            const product = await productModel.findById(productId).select('ratings averageRating reviewCount');
            if (!product) {
                return responseReturn(res, 404, { error: 'Product not found.' });
            }

            const reviewToDelete = product.ratings.id(reviewId)
                || product.ratings.find((item) => item?._id?.toString() === reviewId);
            if (!reviewToDelete) {
                return responseReturn(res, 404, { error: 'Review not found.' });
            }

            const reviewRecord = typeof reviewToDelete.toObject === 'function'
                ? reviewToDelete.toObject()
                : reviewToDelete;
            const isFakeReview = !reviewRecord?.user;

            const assetMap = new Map();
            const registerAssetForDeletion = (publicId, resourceType = 'image') => {
                if (!publicId) return;
                const normalizedType = resourceType || 'image';
                const key = `${normalizedType}:${publicId}`;
                if (!assetMap.has(key)) {
                    assetMap.set(key, { publicId, resourceType: normalizedType });
                }
            };

            if (isFakeReview) {
                const profilePublicId = reviewRecord?.userImage?.public_id
                    || extractPublicId(reviewRecord?.userImage?.url || '');
                registerAssetForDeletion(profilePublicId, reviewRecord?.userImage?.resource_type || 'image');
            }

            if (Array.isArray(reviewRecord?.images)) {
                reviewRecord.images.forEach((item) => {
                    const publicId = getReviewImagePublicId(item);
                    if (!publicId) return;
                    const resourceType = getReviewImageResourceType(item);
                    registerAssetForDeletion(publicId, resourceType);
                });
            }

            const filtered = product.ratings.filter((item) => item?._id?.toString() !== reviewId);

            product.ratings = filtered;
            product.markModified('ratings');

            product.averageRating = computeAverageRatingValue(filtered);
            product.reviewCount = filtered.length;

            await product.save();

            const assetsToDelete = Array.from(assetMap.values());
            if (assetsToDelete.length) {
                try {
                    cloudinary.config({
                        cloud_name: process.env.cloud_name,
                        api_key: process.env.api_key,
                        api_secret: process.env.api_secret,
                        secure: true,
                    });

                    await Promise.all(
                        assetsToDelete.map(async ({ publicId, resourceType }) => {
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
                } catch (configError) {
                    console.error('Cloudinary configuration failed for review cleanup:', configError?.message || configError);
                }
            }

            return responseReturn(res, 200, {
                message: 'Review deleted successfully.',
                deletedReviewId: reviewId,
                averageRating: product.averageRating,
                reviewCount: product.reviewCount,
            });
        } catch (error) {
            console.error('delete_product_review error:', error);
            return responseReturn(res, 500, { error: 'Failed to delete review.' });
        }
    };

    generate_product_social_preview = async (req, res) => {
        if (req.role !== 'admin') {
            return responseReturn(res, 403, { error: 'Only administrators can generate social media posts.' });
        }

        try {
            const { title, description, images = [], brand = '', productUrl = '' } = req.body || {};
            const preview = await generateProductSocialCopy({
                title,
                description,
                imageHints: images,
                brand,
                productUrl,
            });

            return responseReturn(res, 200, { preview });
        } catch (error) {
            console.error('generate_product_social_preview error:', error);
            const message = error?.message || 'Failed to generate social post preview';
            const status = /required/i.test(message) ? 400 : 500;
            return responseReturn(res, status, { error: message });
        }
    };

    publish_product_social_post = async (req, res) => {
        if (req.role !== 'admin') {
            return responseReturn(res, 403, { error: 'Only administrators can publish social media posts.' });
        }

        const form = formidable({ multiples: true, keepExtensions: true });

        form.parse(req, async (err, fields, files) => {
            if (err) {
                return responseReturn(res, 400, { error: err.message });
            }

            const title = sanitizeStringField(fields.title);
            const caption = sanitizeStringField(fields.caption);
            const callToAction = sanitizeStringField(fields.callToAction);
            const productUrl = sanitizeStringField(fields.productUrl || fields.link);
            const hashtags = parseSocialTags(fields.hashtags || fields.tags);
            const imageFile = pickFirstValue(files.image || files.primaryImage || files.socialImage);

            if (!title || !caption) {
                return responseReturn(res, 400, { error: 'A title and caption are required to publish the post.' });
            }

            if (!imageFile || !imageFile.filepath) {
                return responseReturn(res, 400, { error: 'An image is required for social media publishing.' });
            }

            try {
                const result = await publishProductSocialPost({
                    title,
                    caption,
                    callToAction,
                    productUrl,
                    hashtags,
                    imagePath: imageFile.filepath,
                });
                return responseReturn(res, 200, result);
            } catch (error) {
                console.error('publish_product_social_post error:', error);
                const message = error?.response?.data?.error?.message || error?.message || 'Failed to publish social post';
                const statusCode = error?.response?.status || (/required/i.test(message) ? 400 : 500);
                return responseReturn(res, statusCode, { error: message });
            }
        });
    };

    product_visibility = async (req, res) => {
        const { productId, isHidden } = req.body;
        try {
            const product = await productModel.findByIdAndUpdate(
                productId,
                { isHidden },
                { new: true }
            );
            if (!product) {
                return responseReturn(res, 404, { error: "Product not found" });
            }
            const message = isHidden ? "Product hidden successfully" : "Product unhidden successfully"
            return responseReturn(res, 200, { message, product });
        } catch (error) {
            return responseReturn(res, 500, { error: error.message });
        }
    }

    deleteProduct = async (req, res) => {
        try {
            const productId = req.params.id;
            const product = await productModel.findById(productId);
            if (!product) {
                return responseReturn(res, 404, { error: "Product Not Found" })
            }

            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true
            })

            const getPublicId = (url) => {
                const parts = url.split('/');
                const uploadIndex = parts.indexOf('upload')
                if (uploadIndex !== -1) {
                    const publicIdParts = parts.slice(uploadIndex + 2);
                    const publicIdWithExt = publicIdParts.join('/');
                    return publicIdWithExt.replace(/\.[^/.]+$/, '');
                }
                return url.split('/').pop().split('.')[0];
            };

            if (product.images && product.images.length) {
                for (const img of product.images) {
                    const publicId = getPublicId(img);
                    await cloudinary.uploader.destroy(publicId);
                }
            }

            if (product.videos && product.videos.length) {
                for (const vid of product.videos) {
                    const publicId = getPublicId(vid);
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'video' })
                }
            }

            await productModel.findByIdAndDelete(productId)

            return responseReturn(res, 200, { message: "Product deleted successfully" })
        } catch (error) {
            return responseReturn(res, 500, { error: "Internal Server Error" })
        }
    }

    trigger_ingestion = async (req, res) => {
        if (req.role !== 'admin') {
            return responseReturn(res, 403, { error: 'Only administrators can trigger ingestion.' });
        }

        const { provider } = req.body;

        ingestionService.run(provider).catch(error => {
            console.error('[Background Ingestion] Error:', error);
        });

        return responseReturn(res, 202, { message: `Ingestion process initiated${provider ? ` for ${provider}` : ''}.` });
    }
}

export default new productController();