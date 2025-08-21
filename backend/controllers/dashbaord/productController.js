import formidable from "formidable";
import responseReturn from "../../utils/response.js";
import { v2 as cloudinary } from 'cloudinary';
import productModel from "../../models/productModel.js";
import { response } from "express";

class productController{
    add_product = async(req, res) => {
        const {id} = req;
        const form = formidable({multiples: true});

        form.parse(req, async(err, field, files) => {
            let {name, category, description, stock, price, discount, deliveryTime, shopName, brand, colors, sizes, colorPrices} = field;

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

                const parseMap = (str) => {
                    const obj = {};
                    if (str){
                        String(str).split(',').forEach(p=>{
                            const [k,v] = p.split(':').map(s=>s.trim());
                            if (k && v){
                                obj[k] = parseFloat(v);
                            }
                        })
                    }
                    return obj;
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
                    colors: colors ? String(colors).split(',').map(c => c.trim()).filter(Boolean) : [],
                    sizes: sizes ? String(sizes).split(',').map(c => c.trim()).filter(Boolean) : [],
                    colorImages: allColorImageUrl,
                    colorPrices: parseMap(colorPrices)
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
        let {name, description, stock, price, category, discount, deliveryTime, brand, colors, sizes, colorPrices, productId} = req.body;

        name = String(name).trim()
        const slug = name.split(' ').join('-')

        const colorArr = colors ? String(colors).split(',').map(c => c.trim()).filter(Boolean) : []
        const sizeArr = sizes ? String(sizes).split(',').map(s => s.trim()).filter(Boolean) : []

        try{
            const parseMap = (str) => {
                const obj = {};
                if (str) {
                    String(str).split(',').forEach(p=>{
                        const [k, v] = p.split(':').map(s=>s.trim());
                        if (k && v){
                            obj[k] = parseFloat(v);
                        }
                    })
                }
                return obj
            };
            const product = await productModel.findById(productId)
            if(!product){
                return responseReturn(res, 404, {error: 'Product not found'})
            }
            if(colorArr.length !== (product.colorImages ? product.colorImages.length : 0)){
                return responseReturn(res, 400, {error: 'Number of colors and color images must match'})
            }

            await productModel.findByIdAndUpdate(productId, {
                name, description, stock, price, category, discount, deliveryTime, brand,
                colors: colorArr,
                colorPrices: parseMap(colorPrices),
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
        const { url } = req.body;
        if(!url){
            return responseReturn(res, 400, {error: 'URL is required'});
        }
        try{
            const response = await fetch(url);
            const html = await response.text();

            const titleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["'][^>]*>/i) || html.match(/<title>([^<]*)<\/title>/i);
            const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i);
            const priceMatch = html.match(/"formatedActivityPrice":"([^"]+)"/);
            const imageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["'][^>]*>/i);

            const runParamsMatch = html.match(/window.runParams\s*=\s*({.*?});/s);
            let colors = [];
            let types = [];
            let colorImages = [];
            if(runParamsMatch){
                try{
                    const data = JSON.parse(runParamsMatch[1]);
                    const props = data?.data?.skuModule?.productSKUPropertyList || [];
                    props.forEach(p => {
                        const name = (p.skuPropertyName || '').toLowerCase();
                        p.skuPropertyValues.forEach(v => {
                            if(name.includes('color')){
                                colors.push(v.propertyValueDisplayName);
                                if(v.skuPropertyImagePath){
                                    colorImages.push('https:' + v.skuPropertyImagePath);
                                }
                            }else{
                                types.push(v.propertyValueDisplayName);
                            }
                        });
                    });
                }catch(err){
                    console.log(err.message);
                }
            }
            const payload = {
                title: titleMatch ? titleMatch[1] : '',
                description: descriptionMatch ? descriptionMatch[1] : '',
                price: priceMatch ? priceMatch[1] : '',
                link: url,
                image: imageMatch ? imageMatch[1] : '',
                colors,
                types,
                colorImages
            };

            console.log('🚀 response payload:', payload);

            return responseReturn(res, 200, payload);
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