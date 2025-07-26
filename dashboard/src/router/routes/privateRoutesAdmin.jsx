import { lazy } from "react"
import AdminDashboard from './../../views/admin/AdminDashboard';
import Orders from "../../views/admin/Order";
import Category from "../../views/admin/Category";

import ChatCustomer from "../../views/admin/ChatCustomer";
import PaymentRequest from "../../views/admin/PaymentRequest";
import AddProduct from './../../views/admin/AddProduct';
import Products from './../../views/admin/Products';
import DiscountProducts from './../../views/admin/DiscountProducts';
import EditProduct from './../../views/admin/EditProduct';
import OrderDetails from './../../views/admin/OrderDetails';
import BlogPost from "../../views/admin/BlogPost";
import BlogEdit from "../../views/admin/BlogEdit";
import AddBlog from "../../views/admin/AddBlog";
import Coupon from "../../views/admin/Coupon";

import HomeSwiper from "../../views/admin/HomeSwiper";

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
        path: 'admin/dashboard/chat-customers',
        element : <ChatCustomer/>,
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
    },
    {
        path: 'admin/dashboard/blog',
        element: <BlogPost/>,
        role: 'admin'
    },
    {
        path: 'admin/dashboard/blog-edit/:id',
        element: <BlogEdit/>,
        role: 'admin'
    },
    {
        path: 'admin/dashboard/add-blog',
        element: <AddBlog/>,
        role: 'admin'
    },
    {
        path: 'admin/dashboard/coupons',
        element: <Coupon/>,
        role: 'admin'
    },
    {
        path: 'admin/dashboard/home-swiper',
        element: <HomeSwiper/>,
        role: 'admin'
    }
]