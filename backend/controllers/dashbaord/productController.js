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
            let {name, category, description, stock, price, discount, deliveryTime, shopName, brand, colors, types, sizes, colorPrices, sizePrices, typePrices} = field;

            shopName = String(shopName).trim()

            let {images, colorImages, typeImages, videos} = files;
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
                const typeArr = types ? String(types).split(',').map(t => t.trim()).filter(Boolean) : []
                if(colorArr.length !== (files.colorImages ? (Array.isArray(files.colorImages) ? files.colorImages.length : 1) : 0)){
                    return responseReturn(res, 400, {error: 'Number of colors and color images must match'})
                }
                if(typeArr.length !== (files.typeImages ? (Array.isArray(files.typeImages) ? files.typeImages.length : 1) : 0)){
                    return responseReturn(res, 400, {error: 'Number of types and type images must match'})
                }

                let allImageUrl = [];
                let allColorImageUrl = [];
                let allTypeImageUrl = [];
                let allVideoUrl = [];
                if (!Array.isArray(images)){
                    images = [images]
                }
                if (colorImages && !Array.isArray(colorImages)){
                    colorImages = [colorImages]
                }
                if (typeImages && !Array.isArray(typeImages)){
                    typeImages = [typeImages]
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

                if (typeImages){
                    for (let i = 0; i < typeImages.length; ++i){
                        const result = await cloudinary.uploader.upload(typeImages[i].filepath, {folder: 'products/types'});
                        allTypeImageUrl.push(result.url)
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
                                obj[k] = parseInt(v)
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
                    colorImages: allColorImageUrl,
                    typeImages: allTypeImageUrl,
                    types: types ? String(types).split(',').map(c => c.trim()).filter(Boolean) : [],
                    sizes: sizes ? String(sizes).split(',').map(c => c.trim()).filter(Boolean) : [],
                    colorPrices: parseMap(colorPrices),
                    sizePrices: parseMap(sizePrices),
                    typePrices: parseMap(typePrices)
                })
                responseReturn(res, 201, {message: "Product Added Successfully"})
            }catch(error){
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
        let {name, description, stock, price, category, discount, deliveryTime, brand, colors, types, sizes, colorPrices, sizePrices, typePrices, productId} = req.body;

        name = String(name).trim()
        const slug = name.split(' ').join('-')

        const colorArr = colors ? String(colors).split(',').map(c => c.trim()).filter(Boolean) : []
        const typeArr = types ? String(types).split(',').map(t => t.trim()).filter(Boolean) : []

        try{
            const parseMap = (str) => {
                const obj = {};
                if (str) {
                    String(str).split(',').forEach(p=>{
                        const [k, v] = p.split(':').map(s=>s.trim());
                        if (k && v){
                            obj[k] = parseInt(v);
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
            if(typeArr.length !== (product.typeImages ? product.typeImages.length : 0)){
                return responseReturn(res, 400, {error: 'Number of types and type images must match'})
            }

            await productModel.findByIdAndUpdate(productId, {
                name, description, stock, price, category, discount, deliveryTime, brand,
                colors: colorArr,
                types: typeArr,
                sizes: sizes ? String(sizes).split(',').map(c => c.trim()).filter(Boolean) : [],
                colorPrices: parseMap(colorPrices),
                sizePrices: parseMap(sizePrices),
                typePrices: parseMap(typePrices),
                productId, slug
            })
            const updatedProduct = await productModel.findById(productId)
            responseReturn(res, 200, {product: updatedProduct, message: "Product Updated Successfully"})
        }catch(error){
            responseReturn(res, 500, {error: error.message})
        }
    }

    product_image_update = async(req, res) => {
        const form = new formidable.IncomingForm({mutiple: true})

        form.parse(req, async(err, field, files) => {
            const {oldImage, productId, imageType} = field
            const {newImage} = files

            if(err){
                responseReturn(res, 400, {error: err.message})
            }else{
                try{
                    cloudinary.config({
                        cloud_name: process.env.cloud_name,
                        api_key: process.env.api_key,
                        api_secret: process.env.api_secret,
                        secure: true
                    })
                    const result = await cloudinary.uploader.upload(newImage[0].filepath, {folder: 'products'})
                    if(result){

                        if (imageType == 'color'){
                            let {colorImages} = await productModel.findById(productId)
                            const index = colorImages.findIndex(img => img === oldImage)
                            colorImages[index] = result.url;
                            await productModel.findByIdAndUpdate(productId, {colorImages})
                        } else if (imageType == 'type') {
                            let {typeImages} = await productModel.findById(productId)
                            const index = typeImages.findIndex(img => img === oldImage)
                            typeImages[index] = result.url;
                            await productModel.findByIdAndUpdate(productId, {typeImages})
                        }else{
                            let {images} = await productModel.findById(productId)
                            const index = images.findIndex(img => img === oldImage)
                            images[index] = result.url;
                            await productModel.findByIdAndUpdate(productId, {images})
                        }

                        const product = await productModel.findById(productId)
                        responseReturn(res, 200, {product, message: "Product Image Updated Successfully"})
                    }else{
                        responseReturn(res, 404, {error: "Image Upload Failed"})
                    }
                }catch(error){
                    responseReturn(res, 404, {error: "Image Upload Failed"})
                }
            }
        })
    }

    deleteProduct = async(req, res) => {
        try{
            const productId = req.params.id;
            const deleteProduct = await productModel.findByIdAndDelete(productId)
            if(!deleteProduct){
                responseReturn(res, 404, {error: "Product Not Found"})
            }
            responseReturn(res, 200, "Product deleted successfully")
        }catch(error){
            responseReturn(res, 500, {error: "Internal Server Error"})
        }
    }
}

export default new productController();