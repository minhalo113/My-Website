import { AiOutlineDashboard, AiOutlineShoppingCart } from "react-icons/ai";
import { BiCategory } from "react-icons/bi";
import { FaTags } from "react-icons/fa";
import { MdPayment } from "react-icons/md";
import { FaCodePullRequest } from "react-icons/fa6";
import { IoIosChatbubbles } from "react-icons/io";
import { IoMdAdd } from "react-icons/io";
import { MdViewList } from "react-icons/md";
import { TbBasketDiscount } from "react-icons/tb";
import { BsCartCheck } from "react-icons/bs"; 
import { IoChatbubbles } from "react-icons/io5";
import { BsFillChatQuoteFill } from "react-icons/bs";
import { CgProfile } from "react-icons/cg";
import { FaRegNewspaper } from "react-icons/fa";

export const allNav = [
    {
        id : 1,
        title : 'Dashboard',
        icon : <AiOutlineDashboard />,
        role : 'admin',
        path: '/admin/dashboard'
    },
    {
        id : 2,
        title : 'Add Product',
        icon : <IoMdAdd />,
        role : 'admin',
        path: '/admin/dashboard/add-product'
    },     
    {
        id : 3,
        title : 'All Product',
        icon : <MdViewList />,
        role : 'admin',
        path: '/admin/dashboard/products'
    },
    // {
    //     id : 4,
    //     title : 'Discount Product',
    //     icon : <TbBasketDiscount />,
    //     role : 'admin',
    //     path: '/admin/dashboard/discount-product'
    // },
    {
        id : 5,
        title : 'Category',
        icon : <BiCategory  />,
        role : 'admin',
        path: '/admin/dashboard/category'
    },
    {
        id : 6,
        title : 'Orders',
        icon : <AiOutlineShoppingCart />,
        role : 'admin',
        path: '/admin/dashboard/orders'
    },
    // {
    //     id : 7,
    //     title : 'Payment Request',
    //     icon : <MdPayment />,
    //     role : 'admin',
    //     path: '/admin/dashboard/payment-request'
    // },
    {
        id : 8,
        title : 'Live Chat',
        icon : <IoIosChatbubbles />,
        role : 'admin',
        path: '/admin/dashboard/chat-customers'
    },
    {
        id: 9,
        title: 'Blog Post',
        icon: <FaRegNewspaper />,
        role: 'admin',
        path: '/admin/dashboard/blog'
    },
    {
        id: 10,
        title: 'Coupons',
        icon: <FaTags />,
        role: 'admin',
        path: '/admin/dashboard/coupons'
    },
    {
        id: 11,
        title: 'Home Swiper',
        icon: <MdPayment />,
        role: 'admin',
        path: '/admin/dashboard/home-swiper'
    }
]