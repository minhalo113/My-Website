import productModel from "../../models/productModel.js";
import categoryModel from "../../models/categoryModel.js"
import responseReturn from "../../utils/response.js";

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
                responseReturn(res, 200, {categorys, totalCategory})
            }else if (searchValue === '' && page && parPage){
                const categorys = await categoryModel.find({ }).skip(skipPage).limit(parPage).sort({createdAt: -1})
                const totalCategory = await categoryModel.find({ }).countDocuments()
                responseReturn(res, 200, {categorys, totalCategory})
            }
            else{
                const categorys = await categoryModel.find({ }).sort({createdAt: -1})
                const totalCategory = await categoryModel.find({ }).countDocuments()
                responseReturn(res, 200, {categorys, totalCategory})
            }
            
        }catch(error){
            console.log(error)
            responseReturn(res, 500, {error: "Internal Server Error"})
        }
    }

    products_get = async(req, res) => {
        const {page, searchValue, parPage} = req.query

        const skipPage = parseInt(parPage) * (parseInt(page) - 1)

        try{
            if (searchValue) {
                const products = await productModel.find({
                    $text: {$search: searchValue},
                    sellerId: id
                }).skip(skipPage).limit(parPage).sort({createAt: -1})

                const totalProduct = await productModel.find({
                    $text: {$search: searchValue},
                    sellerId: id
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

    rate_product = async(req, res) => {
        try{
            const {rating, comment, images = []} = req.body;
            const product = await productModel.findById(req.params.productId);

            const userId = req.user.id.toString();
            const curUser = req.user;
    
            const existing = product.ratings.find(r => {
                return r.user.toString() === userId; 
            });

            if(existing){
                existing.rating = rating;
                existing.comment = comment;
                existing.images = images;
                existing.createdAt = new Date();
                existing.name = curUser.name;
                existing.userImage = curUser.image;
            }else{
                product.ratings.push({user: userId, rating, comment, images, name: curUser.name, userImage: curUser.image})
            }
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
        try{
            const product = await productModel.findById(req.params.productId);
            const reviewList = product.ratings;
            return responseReturn(res, 200, {reviewList: reviewList})
        }catch(error){
            console.log(error)
            return responseReturn(res, 500, {message: error.message})
        }
    }

}

export default new homeControllers();