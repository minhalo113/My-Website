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
                    // sellerId: id
                }).skip(skipPage).limit(parPage).sort({createdAt: -1})

                const totalProduct = await productModel.find({
                    // sellerId: id
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

}

export default new homeControllers();