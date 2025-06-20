import responseReturn from "../../utils/response.js";
import couponModel from '../../models/couponModel.js';

class couponController {
    add_coupon = async (req, res) => {
        try{
            let {code, discount, maxUses} = req.body;
            code = String(code).trim();
            discount = parseInt(discount);
            maxUses = parseInt(maxUses);

            const exists = await couponModel.findOne({code});
            if(exists){
                return responseReturn(res, 400, {error: "Coupon code already exists", message: "Coupon code already exists"})
            }
            const coupon = await couponModel.create({code, discount, maxUses})
            return responseReturn(res, 201, {coupon, message: 'Coupon added successfully'});
        }catch(error){
            console.log(error);
            return responseReturn(res, 500, {error: 'Internal Server Error', message: "Internal Server Error"})
        }
    };

    get_coupons = async(req, res) => {
        try{
            const coupons = await couponModel.find({}).sort({createdAt: -1})
            return responseReturn(res, 200, {coupons});
        }catch(error){
            return responseReturn(res, 500, {error: 'Internal Server Error', message: "Internal Server Error"})
        }
    }

    apply_coupon = async(req, res) => {
        try{
            let {code} = req.body;
            code = String(code).trim();
            const coupon = await couponModel.findOne({code});

            if(!coupon) {
                return responseReturn(res, 400, {error: 'Invalid coupon code', message: "Invalid coupon code"})
            }

            if(coupon.used >= coupon.maxUses){
                return responseReturn(res, 400, {error: "Coupon usage limit reached", message: "Coupon usage limit reached"})
            }
            return responseReturn(res, 200, {discount: coupon.discount, couponId: coupon._id});

        }catch(error){
            return responseReturn(res, 500, {error: 'Internal Server Error', message: 'Internal Server Error'});
        }
    }

    use_coupon = async(couponId) => {
        if(!couponId) return;
        try{
            await couponModel.findByIdAndUpdate(couponId, { $inc: {used: 1}});
        }catch(error){
            console.log('coupon update error', error.message)
        }
    }

    delete_coupon = async(req, res) => {
        const {couponId} = req.params;
        try{
            const deleted = await couponModel.findByIdAndDelete(couponId);
            if(!deleted){
                return responseReturn(res, 404, {error: 'Coupon not found', message: 'Coupon not found'});
            }
            return responseReturn(res, 200, {message: 'Coupon deleted successfully'});
        }catch(error){
            console.log('delete coupon error', error.message);
            return responseReturn(res, 500, {error: 'Internal Server Error', message: 'Internal Server Error'});
        }
    }

}

export default new couponController();