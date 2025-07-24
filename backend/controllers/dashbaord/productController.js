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
            let {name, category, description, stock, price, discount, shopName, brand, colors, types, sizes} = field;

            shopName = String(shopName).trim()

            let {images, colorImages, typeImages} = files;
            name = String(name).trim()
            const slug = name.split(' ').join('-')

            cloudinary.config({
                cloud_name: process.env.cloud_name,
                api_key: process.env.api_key,
                api_secret: process.env.api_secret,
                secure: true
            })

            try {
                let allImageUrl = [];
                let allColorImageUrl = [];
                let allTypeImageUrl = [];
                if (!Array.isArray(images)){
                    images = [images]
                }
                if (colorImages && !Array.isArray(colorImages)){
                    colorImages = [colorImages]
                }
                if (typeImages && !Array.isArray(typeImages)){
                    typeImages = [typeImages]
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
                    images: allImageUrl,
                    brand: String(brand).trim(),
                    colors: colors ? String(colors).split(',').map(c => c.trim()).filter(Boolean) : [],
                    colorImages: allColorImageUrl,
                    typeImages: allTypeImageUrl,
                    types: types ? String(types).split(',').map(c => c.trim()).filter(Boolean) : [],
                    sizes: sizes ? String(sizes).split(',').map(c => c.trim()).filter(Boolean) : []
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
        let {name, description, stock, price, category, discount, brand, colors, types, sizes, productId} = req.body;

        name = String(name).trim()
        const slug = name.split(' ').join('-')

        try{
            await productModel.findByIdAndUpdate(productId, {
                name, description, stock, price, category, discount, brand,
                colors: colors ? String(colors).split(',').map(c => c.trim()).filter(Boolean) : [],
                types: types ? String(types).split(',').map(c => c.trim()).filter(Boolean) : [],
                sizes: sizes ? String(sizes).split(',').map(c => c.trim()).filter(Boolean) : []
                ,productId, slug
            })
            const product = await productModel.findById(productId)
            responseReturn(res, 200, {product, message: "Product Updated Successfully"})
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