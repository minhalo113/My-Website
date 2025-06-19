import responseReturn from "../../utils/response.js";
import customerOrder from '../../models/orderModel.js';

class orderController {
    get_seller_orders = async(req, res) => {
        let {page, searchValue, parPage} = req.query
        page = parseInt(page)
        parPage = parseInt(parPage)

        const skipPage = parPage * (page - 1)

        try{
            let query = {}

            if(searchValue) {
                const regex = new RegExp(searchValue, 'i');
                query = {
                    $or: [
                        {'customerEmail': {$regex: regex}},
                        {'customerName': {$regex: regex}},
                        {'shippingInfo.address': {$regex: regex}},
                        {'shippingInfo.phoneNumber': {$regex: regex}},
                        {'products': {$elemMatch: {name: {$regex: regex}}}}
                    ]
                };
            }

            const orders = await customerOrder.find(query).skip(skipPage).limit(parPage).sort({createdAt: -1});
            const totalOrder = await customerOrder.countDocuments(query);

            responseReturn(res, 200, {orders, totalOrder})

        }catch(error){
            console.log('get seller Order error: ' + error.message);
            responseReturn(res, 500, {message: "Internal server error"});
        }
    }

    get_seller_order = async(req, res) => {
        const {orderId} = req.params

        try{
            const order = await customerOrder.findById(orderId)
            responseReturn(res, 200, {order})
        }catch(error){
            console.log('get seller details error' + error.message)
        }
    }

    seller_order_delivery_status_update = async(req, res) => {
        const {orderId} = req.params
        const {delivery_status} = req.body

        try{ 
            await customerOrder.findByIdAndUpdate(orderId,{
                delivery_status: delivery_status
            })
            responseReturn(res, 200, {message: 'order delivery status updated successfully'})
        }catch(error){
            console.log("get seller Order error" + error.message)
            responseReturn(res, 500, {message: 'internal server error'})
        }
    }

    seller_order_accept_reject_status_update = async(req, res) =>{
        const {orderId} = req.params
        const {order_status} = req.body

        try{
            await customerOrder.findByIdAndUpdate(orderId, {
                order_status: order_status
            })
            responseReturn(res, 200, {message: 'order status updated successfully'})
        }catch(error){
            console.log('get seller order error' + error.message)
            responseReturn(res, 500, {message: 'internal server error'})
        }
    }

    seller_payment_accept_reject_status_update = async(req, res) => {
        const {orderId} = req.params
        const {payment_status} = req.body

        try{
            await customerOrder.findByIdAndUpdate(orderId, {
                payment_status: payment_status
            })
            responseReturn(res, 200, {message: 'payment status updated successfully'})
        }catch(error){
            console.log('get payment order error' + error.message)
            responseReturn(res, 500, {message: 'internal server error'})
        }
    }

    delete_order = async(req, res) => {
        const {orderId} = req.params;
        try{
            const deleted = await customerOrder.findByIdAndDelete(orderId)
            if(!deleted){
                return responseReturn(res, 404, {error: 'Order Not Found', message: 'Order Not Found'})
            }
            return responseReturn(res, 200, "Order deleted successfully")
        }catch(error){
            console.log('Delete Order Error', error.message);
            return responseReturn(res, 500, {error: 'Internal Server Error', message: 'Internal Server Error'})
        }
    }

    get_customer_orders = async(req, res) => {
        const {user} = req;
        const id = user.id;

        try {
            const orders = await customerOrder.find({customerId: id}).sort({createdAt: -1});
            responseReturn(res, 200, {orders: orders})
        }catch(err){
            console.error(err);
            responseReturn(res, 500, {message: 'internal server error'})
        }
    }
}

export default new orderController();