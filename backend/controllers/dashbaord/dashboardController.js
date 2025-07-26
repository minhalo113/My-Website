import customerOrder from '../../models/orderModel.js'
import productModel from '../../models/productModel.js'
import customerModel from '../../models/customerModel.js'
import responseReturn from '../../utils/response.js';

class dashboardController {
    admin_dashboard_data = async(req, res) => {
        try{
            const [totalOrder, totalProduct, totalCustomer, orders] = await Promise.all([
                customerOrder.countDocuments(),
                productModel.countDocuments(),
                customerModel.countDocuments(),
                customerOrder.find({}).sort({createdAt: -1}).limit(5)
            ]);
            const totalSaleAgg = await customerOrder.aggregate([
                {$group: {_id: null, total: { $sum: "$price"}}}
            ])

            const totalSale = totalSaleAgg[0]?.total || 0;
            return responseReturn(res, 200, {
                totalSale,
                totalOrder,
                totalProduct,
                totalCustomer,
                recentOrder: orders
            })
        }catch(error){
            console.log('dashboard data error', error.message);
            return responseReturn(res, 500, {error: 'Internal Server Error'});
        }
    }
}

export default new dashboardController();