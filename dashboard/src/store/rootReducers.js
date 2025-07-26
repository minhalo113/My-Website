import authReducer from "./Reducers/authReducer.js"
import categoryReducer from "./Reducers/categoryReducer.js";
import productReducer from "./Reducers/productReducer.js";
import OrderReducer from "./Reducers/OrderReducer.js"
import blogReducer from "./Reducers/blogReducer.js";
import couponReducer from './Reducers/couponReducer.js'
import homeSwiperReducer from './Reducers/homeSwiperReducer.js'
import dashboardReducer from './Reducers/dashboardReducer.js'

const rootReducer = {
    auth: authReducer,
    category: categoryReducer,
    product: productReducer,
    // // chat: chatReducer,
    order: OrderReducer,
    blog: blogReducer,
    coupon: couponReducer,
    homeSwiper: homeSwiperReducer,
    // // payment: PaymentReducer,
    dashboard: dashboardReducer
}
export default rootReducer;