import { lazy } from "react"
import AdminDashboard from './../../views/admin/AdminDashboard';
import Orders from "../../views/admin/Order";
import Category from "../../views/admin/Category";
import ChatSeller from "../../views/admin/ChatSeller";
import PaymentRequest from "../../views/admin/PaymentRequest";
import AddProduct from './../../views/admin/AddProduct';
import Products from './../../views/admin/Products';
import DiscountProducts from './../../views/admin/DiscountProducts';
import EditProduct from './../../views/admin/EditProduct';
import OrderDetails from './../../views/admin/OrderDetails';

export const privateRoutesAdmin = [
    {
        path: "admin/dashboard",
        element: <AdminDashboard/>,
        role: 'admin'
    },
    {
        path: 'admin/dashboard/orders',
        element : <Orders/> ,
        role : 'admin'
    },
    {
        path: 'admin/dashboard/category',
        element : <Category/>,
        role : 'admin'
    },
    {
        path: 'admin/dashboard/chat-sellers',
        element : <ChatSeller/> ,
        role : 'admin'
    },
    {
        path: 'admin/dashboard/payment-request',
        element : <PaymentRequest/> ,
        role : 'admin'
    },
    {
        path: 'admin/dashboard/add-product',
        element : <AddProduct/> ,
        role : 'admin'
    },
    {
        path: 'admin/dashboard/products',
        element : <Products/> ,
        role : 'admin'
    },
    {
        path: 'admin/dashboard/discount-product',
        element : <DiscountProducts/> ,
        role : 'admin'
    },
    {
        path: 'admin/dashboard/edit-product/:productId',
        element: <EditProduct/>,
        role: 'admin'
    },
    {
        path: 'admin/dashboard/order/details/:orderId',
        element: <OrderDetails/>,
        role: 'admin'
    }
]