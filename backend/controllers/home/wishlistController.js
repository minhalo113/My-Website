import responseReturn from "../../utils/response.js";
import customerModel from "../../models/customerModel.js";
import productModel from "../../models/productModel.js";
import mongoose from "mongoose";

class wishlistController {
    add_to_wishlist = async(req, res) => {
        try {
            const userId = req.user.id;
            const {productId} = req.body;

            if (!mongoose.Types.ObjectId.isValid(productId)){
                return responseReturn(res, 400, {message: "Invalid Product Id"})
            }

            const product = await productModel.findById(productId);
            if(!product){
                return responseReturn(res, 404, {message: "Product Not Found"})
            }

            const customer = await customerModel.findById(userId)
            const alreadyExists = customer.wishlist.some(w => w.productId.equals(productId));

            if (alreadyExists){
                return responseReturn(res, 400, {message: "Already in wishlist"})
            }

            customer.wishlist.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                images: Array.isArray(product.images) ? product.images[0] : product.images
            })

            await customer.save()
            return responseReturn(res, 200, {message: "Added to wishlist"})

        }catch(err){
            console.error(err);
            return responseReturn(res, 500, {message:"Server Error"})
        }
    }

    remove_from_wishlist = async(req, res) => {
        try{
            const userId = req.user.id;
            const {productId} = req.body;

            const customer = await customerModel.findById(userId);
            if (!customer){
                return responseReturn(res, 404, {message: "User not found"})
            }

            const newWishlist = customer.wishlist.filter(
                (item) => !item.productId.equals(productId)
            )

            customer.wishlist = newWishlist;
            await customer.save();

            return responseReturn(res, 200, {message: "Removed from wishlist"})
        }catch(err){
            console.error(err);
            return responseReturn(res, 500, {message: "Server error"})
        }
    }

    get_products_from_wishlist = async(req, res) => {
        try{
            const {user} = req;
            const id = user.id
    
            const customer = await customerModel.findById(id).select("wishlist");
    
            if(!customer) {
                return responseReturn(res, 404, {message: "User not found"})
            }
            return responseReturn(res, 200, {wishlist: customer.wishlist})
            
        }catch(err){
            return responseReturn(res, 500, {message: err})
        }
    }
}

export default new wishlistController();