import formidable from "formidable";
import responseReturn from "../../utils/response.js";
import { v2 as cloudinary } from 'cloudinary';
import productModel from "../../models/productModel.js";
import { response } from "express";
import crypto from 'crypto';
import axios from 'axios';
import parseColorPrices from '../../utils/parseColorPrices.js';
import extractSkuImagesAndPrices from '../../utils/extractSkuImagesAndPrices.js';
import {
    extractPublicId,
    fingerprintFromUploadResult,
    hammingDistance,
    fingerprintSimilarity
} from '../../utils/imageFingerprint.js';

const SEARCHABLE_PRODUCTS_QUERY = {
    $or: [
        { imageFingerprints: { $exists: true, $ne: [] } },
        { colorImageFingerprints: { $exists: true, $ne: [] } },
    ],
};

const SEARCHABLE_PRODUCTS_FIELDS =
    'name brand category images imageFingerprints colorImages colorImageFingerprints colors shopName sellerId slug price discount stock link';

const normalizeUploadList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value.filter(Boolean);
    }
    return value ? [value] : [];
};

const fetchProductsForImageSearch = async () => {
    return await productModel
        .find(SEARCHABLE_PRODUCTS_QUERY)
        .select(SEARCHABLE_PRODUCTS_FIELDS)
        .lean();
};

const collectMatchesForFingerprint = ({ products = [], queryFingerprint, threshold }) => {
    if (!queryFingerprint) {
        return [];
    }

    const matches = [];

    const pushMatch = ({ product, imageUrl, distance, matchType, fingerprint, colorLabel, index }) => {
        if (!Number.isFinite(distance) || distance > threshold) return;
        matches.push({
            productId: product._id.toString(),
            productName: product.name,
            brand: product.brand,
            category: product.category,
            imageUrl,
            matchType,
            distance,
            similarity: fingerprintSimilarity(distance),
            fingerprint,
            colorLabel: colorLabel || null,
            index,
            shopName: product.shopName,
            sellerId: product.sellerId?.toString?.() || product.sellerId,
            slug: product.slug,
            price: product.price,
            discount: product.discount,
            stock: product.stock,
            link: product.link,
        });
    };

    for (const product of products) {
        const images = Array.isArray(product.images) ? product.images : [];
        const imageFingerprints = Array.isArray(product.imageFingerprints) ? product.imageFingerprints : [];
        const colorImages = Array.isArray(product.colorImages) ? product.colorImages : [];
        const colorFingerprints = Array.isArray(product.colorImageFingerprints) ? product.colorImageFingerprints : [];
        const colorLabels = Array.isArray(product.colors) ? product.colors : [];

        images.forEach((imgUrl, idx) => {
            const fingerprint = imageFingerprints[idx];
            if (!fingerprint || !imgUrl) return;
            const distance = hammingDistance(queryFingerprint, fingerprint);
            pushMatch({
                product,
                imageUrl: imgUrl,
                distance,
                matchType: 'primary',
                fingerprint,
                index: idx,
            });
        });

        colorImages.forEach((imgUrl, idx) => {
            const fingerprint = colorFingerprints[idx];
            if (!fingerprint || !imgUrl) return;
            const distance = hammingDistance(queryFingerprint, fingerprint);
            pushMatch({
                product,
                imageUrl: imgUrl,
                distance,
                matchType: 'color',
                fingerprint,
                colorLabel: colorLabels[idx],
                index: idx,
            });
        });
    }

    matches.sort((a, b) => a.distance - b.distance);
    return matches;
};

class productController{
    checkDuplicateLink = async(link, excludeId = null) => {
        const trimmed = String(link).trim();
        if(!trimmed) {
            return null;
        }
        const query = {link: trimmed};
        if(excludeId) {
            query._id = { $ne: excludeId};
        }
        return await productModel.findOne(query);
    }

    add_product = async(req, res) => {
        const {id} = req;
        const form = formidable({multiples: true});

        form.parse(req, async(err, field, files) => {
            let {name, category, description, stock, price, discount, deliveryTime, shopName, brand, colors, sizes, colorPrices, link} = field;

            shopName = String(shopName).trim()

            let {images, colorImages, videos} = files;

            name = String(name).trim()
            const slug = name.split(' ').join('-')

            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true
            })

            try {
                if(link && String(link).trim()){
                    const duplicate = await this.checkDuplicateLink(link);

                    if(duplicate){
                        return responseReturn(res, 409, {error: 'Product link already exists'})
                    }
                }

                const colorArr = colors ? String(colors).split(',').map(c => c.trim()).filter(Boolean) : []

                if(colorArr.length !== (files.colorImages ? (Array.isArray(files.colorImages) ? files.colorImages.length : 1) : 0)){
                    return responseReturn(res, 400, {error: 'Number of colors and color images must match'})
                }

                let allImageUrl = [];
                let imageFingerprints = [];
                let allColorImageUrl = [];
                let colorImageFingerprints = [];

                let allVideoUrl = [];
                if (!Array.isArray(images)){
                    images = [images]
                }
                if (colorImages && !Array.isArray(colorImages)){
                    colorImages = [colorImages]
                }

                if (videos && !Array.isArray(videos)){
                    videos = [videos]
                }

                for (let i = 0; i < images.length; ++i){
                    const result = await cloudinary.uploader.upload(images[i].filepath, {folder: 'products', phash: true});
                    const url = result.secure_url || result.url;
                    allImageUrl.push(url);
                    imageFingerprints.push(fingerprintFromUploadResult(result) || '');
                }

                if (colorImages){
                    for (let i = 0; i < colorImages.length; ++i){
                        const result = await cloudinary.uploader.upload(colorImages[i].filepath, {folder: 'products/colors', phash: true});
                        const url = result.secure_url || result.url;
                        allColorImageUrl.push(url);
                        colorImageFingerprints.push(fingerprintFromUploadResult(result) || '');
                    }
                }

                if(videos){
                    for (let i = 0; i < videos.length; ++i){
                        const result = await cloudinary.uploader.upload(videos[i].filepath, {folder: 'products/videos', resource_type: 'video'});
                        allVideoUrl.push(result.url)
                    }
                }

                await productModel.create({
                    sellerId: id,
                    name,
                    slug,
                    shopName,
                    category: String(category).trim(),
                    description: String(description).trim(),
                    stock: parseInt(stock),
                    price: parseInt(price),
                    discount: parseInt(discount),
                    deliveryTime: deliveryTime ? String(deliveryTime).trim() : '',
                    images: allImageUrl,
                    imageFingerprints,
                    videos: allVideoUrl,
                    brand: String(brand).trim(),
                    link: link ? String(link).trim() : '',
                    colors: colorArr,
                    sizes: sizes ? String(sizes).split(',').map(c => c.trim()).filter(Boolean) : [],
                    colorImages: allColorImageUrl,
                    colorImageFingerprints,
                    colorPrices: parseColorPrices(colorPrices)
                })
                return responseReturn(res, 201, {message: "Product Added Successfully"})
            }catch(error){
                console.log(error.message)
                return responseReturn(res, 500, {error: error.message})
            }
        })
    }

    products_get = async(req, res) => {
        const {page, searchValue, parPage} = req.query
        const {id} = req;

        const skipPage = parseInt(parPage) * (parseInt(page) - 1)

        try{
            if (searchValue) {
                const products = await productModel.find({
                    $text: {$search: searchValue}
                }).skip(skipPage).limit(parPage).sort({createAt: -1})

                const totalProduct = await productModel.find({
                    $text: {$search: searchValue}
                }).countDocuments()


                return responseReturn(res, 200, {products, totalProduct})
            }else if(parPage && page){
                const products = await productModel.find({
                }).skip(skipPage).limit(parPage).sort({createdAt: -1})

                const totalProduct = await productModel.find({
                }).countDocuments()
                
                return responseReturn(res, 200, {products, totalProduct})
            }else{
                const products = await productModel.find({ }).sort({createdAt: -1})
                const totalProduct = await productModel.find({ }).countDocuments()

                return responseReturn(res, 200, {products, totalProduct})
            }
        }catch(error){
            return responseReturn(res, 500, {error: error.message})
        }
    }

    product_get = async(req, res) => {
        const {productId} = req.params;
        try{
            const product = await productModel.findById(productId)
            return responseReturn(res, 200, {product})
        }catch(error){
            return responseReturn(res, 500, {error: error.message})
        }
    }

    product_update = async(req, res) => {
        let {name, description, stock, price, category, discount, deliveryTime, brand, colors, sizes, colorPrices, productId, link} = req.body;

        name = String(name).trim()
        const slug = name.split(' ').join('-')

        const colorArr = colors ? String(colors).split(',').map(c => c.trim()).filter(Boolean) : []
        const sizeArr = sizes ? String(sizes).split(',').map(s => s.trim()).filter(Boolean) : []

        try{
            const product = await productModel.findById(productId)
            if(!product){
                return responseReturn(res, 404, {error: 'Product not found'})
            }
            if(colorArr.length !== (product.colorImages ? product.colorImages.length : 0)){
                return responseReturn(res, 400, {error: 'Number of colors and color images must match'})
            }

            if(link && String(link).trim()){
                const duplicate = await this.checkDuplicateLink(link, productId);
                if(duplicate){
                    return responseReturn(res, 409, {error: 'Product link already exists'})
                }
            }

            await productModel.findByIdAndUpdate(productId, {
                name, description, stock, price, category, discount, deliveryTime, brand,
                link: link ? String(link).trim() : '',
                colors: colorArr,
                colorPrices: parseColorPrices(colorPrices),
                productId, slug
            })
            const updatedProduct = await productModel.findById(productId)
            return responseReturn(res, 200, {product: updatedProduct, message: "Product Updated Successfully"})
        }catch(error){
            return responseReturn(res, 500, {error: error.message})
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
            const parsedThreshold = thresholdField ? parseInt(thresholdField, 10) : 10;
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
                const matches = collectMatchesForFingerprint({
                    products,
                    queryFingerprint,
                    threshold,
                });
                
                return responseReturn(res, 200, {
                    matches: matches.slice(0, 20),
                    totalMatches: matches.length,
                    queryFingerprint,
                    threshold,
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
            const parsedThreshold = thresholdField ? parseInt(thresholdField, 10) : 10;
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

                    const matches = collectMatchesForFingerprint({
                        products,
                        queryFingerprint: item.queryFingerprint,
                        threshold,
                    });

                    return {
                        sourceType: item.sourceType,
                        sourceIndex: item.sourceIndex,
                        filename: item.filename,
                        matches: matches.slice(0, 15),
                        totalMatches: matches.length,
                        queryFingerprint: item.queryFingerprint,
                        error: null,
                    };
                });

                const totalMatches = results.reduce((sum, entry) => sum + (entry.matches?.length || 0), 0);

                return responseReturn(res, 200, {
                    threshold,
                    totalQueries: queries.length,
                    successfulQueries,
                    results,
                    totalMatches,
                });
            }catch(error){
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

    import_aliexpress_product = async(req, res) => {
        const { url, productId: bodyProductId } = req.body;
        const productId = bodyProductId || (url ? url.match(/(\d+)/)?.[1] : null);
        if(!productId){
            return responseReturn(res, 400, {error: 'Product ID is required'});
        }

        try{
            const APP_KEY = process.env.APP_KEY;
            const APP_SECRET = process.env.APP_SECRET;
            const REFRESH_TOKEN = process.env.REFRESH_TOKEN;

            const sha256HexUpper = (s) =>
                crypto.createHash('sha256').update(s, 'utf8').digest('hex').toUpperCase();
            const hmacSha256HexUpper = (key, s) =>
                crypto.createHmac('sha256', key).update(s, 'utf8').digest('hex').toUpperCase();
            const concatSortedKV = (params) =>
                Object.keys(params).sort().map(k => k + String(params[k])).join('');
            const buildQuery = (params) => {
                const usp = new URLSearchParams();
                for(const [k,v] of Object.entries(params)) usp.append(k, String(v));
                return usp.toString();
            };

            const refreshAccessToken = async () => {
                const apiPath = '/auth/token/refresh';
                const timestamp = String(Date.now());

                const paramsForSign = {
                    app_key: APP_KEY,
                    refresh_token: REFRESH_TOKEN,
                    sign_method: 'sha256',
                    timestamp,
                };

                const toSign = apiPath + concatSortedKV(paramsForSign);
                const sign = hmacSha256HexUpper(APP_SECRET, toSign);

                const sendParams = { ...paramsForSign, sign };
                const url = `https://api-sg.aliexpress.com/rest${apiPath}`;
                const body = buildQuery(sendParams);

                const { data } = await axios.post(url, body, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
                });

                const payload = typeof data === 'string' ? JSON.parse(data) : data;
                if (payload.error_response) {
                    throw new Error(`Token refresh failed: ${JSON.stringify(payload.error_response, null, 2)}`);
                }
                const accessToken =
                    payload.access_token ||
                    payload?.response?.access_token ||
                    payload?.body?.access_token;

                if (!accessToken) {
                    throw new Error(`No access_token in response: ${JSON.stringify(payload, null, 2)}`);
                }
                return accessToken;
            };

            const getProduct = async ({ accessToken, productId, shipTo = 'CA', currency = 'CAD' }) => {
                const method = 'aliexpress.ds.product.get';
                const timestamp = String(Date.now());

                const paramsForSign = {
                    access_token: accessToken,
                    app_key: APP_KEY,
                    method,
                    ship_to_country: shipTo,
                    product_id: productId,
                    target_currency: currency,
                    sign_method: 'sha256',
                    timestamp,
                };

                const toSign = concatSortedKV(paramsForSign);
                const sign = hmacSha256HexUpper(APP_SECRET, toSign);

                const sendParams = { ...paramsForSign, sign };
                const qs = buildQuery(sendParams);
                const url = `https://api-sg.aliexpress.com/sync?method=${encodeURIComponent(method)}&${qs}`;

                const { data } = await axios.get(url);

                const payload = typeof data === 'string' ? JSON.parse(data) : data;

                if (payload.error_response) {
                    throw new Error(`Business call failed: ${JSON.stringify(payload.error_response, null, 2)}`);
                }
                return payload;
            };

            if (!APP_KEY || !APP_SECRET || !REFRESH_TOKEN) {
                throw new Error('Missing AliExpress API credentials');
            }

            const accessToken = await refreshAccessToken();
            const productResp = await getProduct({ accessToken, productId, shipTo: 'CA', currency: 'CAD' });

            console.log(productResp)
            const extracted = extractSkuImagesAndPrices(productResp);
            return res.status(200).json(extracted);
        }catch(error){
            console.error('import_aliexpress_product error:', error);
            return responseReturn(res, 500, {error: 'Failed to import product'});
        }

    }

    product_visibility = async(req, res) => {
        const {productId, isHidden} = req.body;
        try{
            const product = await productModel.findByIdAndUpdate(
                productId,
                {isHidden},
                {new: true}
            );
            if (!product){
                return responseReturn(res, 404, {error: "Product not found"});
            }
            const message = isHidden ? "Product hidden successfully" : "Product unhidden successfully"
            return responseReturn(res, 200, {message, product});
        }catch(error){
            return responseReturn(res, 500, {error: error.message});
        }
    }

    deleteProduct = async(req, res) => {
        try{
            const productId = req.params.id;
            const product = await productModel.findById(productId);
            if(!product){
                return responseReturn(res, 404, {error: "Product Not Found"})
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
                if(uploadIndex !== -1){
                    const publicIdParts = parts.slice(uploadIndex + 2);
                    const publicIdWithExt = publicIdParts.join('/');
                    return publicIdWithExt.replace(/\.[^/.]+$/, '');
                }
                return url.split('/').pop().split('.')[0];
            };

            if (product.images && product.images.length){
                for (const img of product.images){
                    const publicId = getPublicId(img);
                    await cloudinary.uploader.destroy(publicId);
                }
            }

            if (product.videos && product.videos.length){
                for (const vid of product.videos){
                    const publicId = getPublicId(vid);
                    await cloudinary.uploader.destroy(publicId, {resource_type: 'video'})
                }
            }

            await productModel.findByIdAndDelete(productId)

            return responseReturn(res, 200, {message: "Product deleted successfully"})
        }catch(error){
            return responseReturn(res, 500, {error: "Internal Server Error"})
        }
    }
}

export default new productController();