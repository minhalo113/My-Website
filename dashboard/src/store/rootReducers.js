import authReducer from "./Reducers/authReducer.js"
import categoryReducer from "./Reducers/categoryReducer.js";
import productReducer from "./Reducers/productReducer.js";
import OrderReducer from "./Reducers/OrderReducer.js"

const rootReducer = {
    auth: authReducer,
    category: categoryReducer,
    product: productReducer,
    // // chat: chatReducer,
    order: OrderReducer,
    // // payment: PaymentReducer,
    // // dashboard: dashboardReducer
}
export default rootReducer;