import formidable from "formidable";
import responseReturn from "../../utils/response.js";
import { v2 as cloudinary } from 'cloudinary';
import productModel from "../../models/productModel.js";
import { response } from "express";
import crypto from 'crypto';
import axios from 'axios';
import parseColorPrices from '../../utils/parseColorPrices.js';
import extractSkuImagesAndPrices from '../../utils/extractSkuImagesAndPrices.js';

class productController{
    checkDuplicateLink = async(link, excludeId = null) => {
        const query = {link: String(link).trim()};
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
                if(link){
                    const duplicate = await this.checkDuplicateLink(link);

                    if(duplicate){
                        responseReturn(res, 409, {error: 'Product link already exists'})
                    }
                }

                const colorArr = colors ? String(colors).split(',').map(c => c.trim()).filter(Boolean) : []

                if(colorArr.length !== (files.colorImages ? (Array.isArray(files.colorImages) ? files.colorImages.length : 1) : 0)){
                    return responseReturn(res, 400, {error: 'Number of colors and color images must match'})
                }

                let allImageUrl = [];
                let allColorImageUrl = [];

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
                    const result = await cloudinary.uploader.upload(images[i].filepath, {folder: 'products'});
                    allImageUrl.push(result.url)
                }

                if (colorImages){
                    for (let i = 0; i < colorImages.length; ++i){
                        const result = await cloudinary.uploader.upload(colorImages[i].filepath, {folder: 'products/colors'});
                        allColorImageUrl.push(result.url)
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
                    videos: allVideoUrl,
                    brand: String(brand).trim(),
                    link: link ? String(link).trim() : '',
                    colors: colorArr,
                    sizes: sizes ? String(sizes).split(',').map(c => c.trim()).filter(Boolean) : [],
                    colorImages: allColorImageUrl,
                    colorPrices: parseColorPrices(colorPrices)
                })
                responseReturn(res, 201, {message: "Product Added Successfully"})
            }catch(error){
                console.log(error.message)
                responseReturn(res, 500, {error: error.message})
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


                responseReturn(res, 200, {products, totalProduct})
            }else if(parPage && page){
                const products = await productModel.find({
                }).skip(skipPage).limit(parPage).sort({createdAt: -1})

                const totalProduct = await productModel.find({
                }).countDocuments()
                
                responseReturn(res, 200, {products, totalProduct})
            }else{
                const products = await productModel.find({ }).sort({createdAt: -1})
                const totalProduct = await productModel.find({ }).countDocuments()

                responseReturn(res, 200, {products, totalProduct})
            }
        }catch(error){
            responseReturn(res, 500, {error: error.message})
        }
    }

    product_get = async(req, res) => {
        const {productId} = req.params;
        try{
            const product = await productModel.findById(productId)
            responseReturn(res, 200, {product})
        }catch(error){
            responseReturn(res, 500, {error: error.message})
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

            if(link){
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
            responseReturn(res, 200, {product: updatedProduct, message: "Product Updated Successfully"})
        }catch(error){
            responseReturn(res, 500, {error: error.message})
        }
    }

    product_image_update = async (req, res) => {
        const form = formidable({
            multiples: true,          // v3 option
            keepExtensions: true,
            allowEmptyFiles: false,
        });

        form.parse(req, async (err, fields, files) => {
            if (err) return responseReturn(res, 400, { error: err.message });

            const { oldImage = '', productId, imageType, action } = fields;
            // In v3, fields are arrays when multiple values; normalize to string
            const _oldImage  = Array.isArray(oldImage)  ? oldImage[0]  : oldImage;
            const _productId = Array.isArray(productId) ? productId[0] : productId;
            const _imageType = Array.isArray(imageType) ? imageType[0] : imageType;
            const _action    = Array.isArray(action)    ? action[0]    : action;

            // file list (always array in v3)
            const newImageFiles = Array.isArray(files.newImage) ? files.newImage : (files.newImage ? [files.newImage] : []);

            // quick helper: extract Cloudinary public_id from a URL
            const getPublicId = (url) => {
            const parts = url.split('/');
            const uploadIndex = parts.indexOf('upload');
            if (uploadIndex !== -1) {
                const publicIdParts = parts.slice(uploadIndex + 2);
                const publicIdWithExt = publicIdParts.join('/');
                return publicIdWithExt.replace(/\.[^/.]+$/, '');
            }
            return url.split('/').pop().split('.')[0];
            };

            try {
            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true,
            });

            // --- DELETE path ---
            if (_action === 'delete') {
                let updateField = {};

                if (_imageType === 'color') {
                let { colorImages } = await productModel.findById(_productId).lean();
                colorImages = (colorImages || []).filter((img) => img !== _oldImage);
                updateField = { colorImages };

                // delete from Cloudinary (image)
                const publicId = getPublicId(_oldImage);
                await cloudinary.uploader.destroy(publicId);
                } else if (_imageType === 'video') {
                let { videos } = await productModel.findById(_productId).lean();
                videos = (videos || []).filter((v) => v !== _oldImage);
                updateField = { videos };

                // delete from Cloudinary (video)
                const publicId = getPublicId(_oldImage);
                await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
                } else {
                // default: images
                let { images } = await productModel.findById(_productId).lean();
                images = (images || []).filter((img) => img !== _oldImage);
                updateField = { images };

                const publicId = getPublicId(_oldImage);
                await cloudinary.uploader.destroy(publicId);
                }

                const product = await productModel.findByIdAndUpdate(_productId, updateField, { new: true });
                const msg = _imageType === 'video' ? 'Product Video Deleted Successfully' : 'Product Image Deleted Successfully';
                return responseReturn(res, 200, { product, message: msg });
            }

            // --- ADD/UPDATE path ---
            // require a file when not deleting
            if (!newImageFiles.length) {
                return responseReturn(res, 400, { error: 'No file uploaded' });
            }

            const folder =
                _imageType === 'color' ? 'products/colors' :
                _imageType === 'video' ? 'products/videos' :
                'products';

            const uploadOpts =
                _imageType === 'video'
                ? { folder, resource_type: 'video' }
                : { folder };

            // take the first file (your UI uploads one at a time here)
            const file = newImageFiles[0];
            const localPath = file.filepath || file.path;

            const result = await cloudinary.uploader.upload(localPath, uploadOpts);
            if (!result) return responseReturn(res, 404, { error: 'Image Upload Failed' });

            const url = result.secure_url || result.url;

            if (_imageType === 'color') {
                let { colorImages = [] } = await productModel.findById(_productId).lean();
                const index = colorImages.findIndex((img) => img === _oldImage);
                if (index > -1) colorImages[index] = url; else colorImages.push(url);
                await productModel.findByIdAndUpdate(_productId, { colorImages });
            } else if (_imageType === 'video') {
                let { videos = [] } = await productModel.findById(_productId).lean();
                const index = videos.findIndex((v) => v === _oldImage);
                if (index > -1) videos[index] = url; else videos.push(url);
                await productModel.findByIdAndUpdate(_productId, { videos });
            } else {
                let { images = [] } = await productModel.findById(_productId).lean();
                const index = images.findIndex((img) => img === _oldImage);
                if (index > -1) images[index] = url; else images.push(url);
                await productModel.findByIdAndUpdate(_productId, { images });
            }

            const product = await productModel.findById(_productId);
            const message =
                _imageType === 'video'
                ? (_oldImage ? 'Product Video Updated Successfully' : 'Product Video Added Successfully')
                : (_oldImage ? 'Product Image Updated Successfully' : 'Product Image Added Successfully');

            return responseReturn(res, 200, { product, message });
            } catch (error) {
            console.error('product_image_update error:', error);
            return responseReturn(res, 500, { error: 'Image Upload Failed' });
            }
        });
    };

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
            return responseReturn(res, 200, {message, produt});
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

            responseReturn(res, 200, "Product deleted successfully")
        }catch(error){
            responseReturn(res, 500, {error: "Internal Server Error"})
        }
    }
}

export default new productController();