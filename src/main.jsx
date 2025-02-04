import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import 'swiper/css'

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.min.js'

import '././assets/css/icofont.min.css'
import '././assets/css/animate.css'
import '././assets/css/style.min.css'

import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Home from './home/Home.jsx'
import Blog from './blog/Blog.jsx'
import Shop from './shop/Shop.jsx'
import SingleProduct from './shop/SingleProduct.jsx'
import CartPage from './shop/CartPage.jsx'
import SingleBlog from './blog/SingleBlog.jsx'
import About from './about/About.jsx'
import Contact from './contactPage/Contact.jsx'
import AuthProvider from './contexts/AuthProvider.jsx'
import Login from './components/Login.jsx'
import Signup from './components/Signup.jsx'
import TermsOfService from './policy/TermsOfServices.jsx'
import PrivacyPolicy from './policy/PrivacyPolicy.jsx'
import RefundPolicy from './policy/RefundPolicy.jsx'
import ShippingPolicy from './policy/ShippingPolicy.jsx'

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Home/> },
      { path: "/blog", element: <Blog/> },
      { path: "/blog/:id", element: <SingleBlog/>},
      { path: "/shop", element: <Shop/> },
      { path: "shop/:id", element: <SingleProduct/>},
      { path: "/cart-page", element: <CartPage/>},
      { path: "/about", element: <About/>},
      { path: "/contact", element: <Contact/>},
      { path: "/privacy-policy", element: <PrivacyPolicy/>},
      { path: "/terms-of-service", element: <TermsOfService/>},
      { path: "/refund-policy", element: <RefundPolicy/>},
      { path: "/shipping-policy", element: <ShippingPolicy/>},
    ],
  },
  {
    path: "login",
    element: <Login/>,
  },
  {
    path: "sign-up",
    element: <Signup/>
  }
]);

createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <RouterProvider router = {router}/>
  </AuthProvider>
);
