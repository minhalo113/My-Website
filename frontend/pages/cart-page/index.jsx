import React, { useState, useEffect, useContext } from 'react'
import PageHeader from '../../components/PageHeader';
import Link from 'next/link';
import {useCart} from "../../context/CartContext"

import api from './../../src/api/api';
import { AuthContext } from '../../context/AuthContext';

const CartPage = () => {
    const {cart: cartItems, add, remove, clear, handleQuantityChange} = useCart();
    const {user, setUser, loading} = useContext(AuthContext);

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const [shipping, setShipping] = useState({
        address: "", phoneNumber: ""
    });

    const calculateTotalPrice = (item) => {
        return item.price * item.qty
    }

    const handleIncrease = (item) => add(item, 1);
    const handleDecrease = (item) => add(item, -1);
    const handleRemoveItem = (item) => remove(item.id);

    const cartSubtotal = cartItems.reduce(
        (t, i) => t + calculateTotalPrice(i), 0
    )

    const handleCheckout  = async(e) => {
        e.preventDefault();

        const required = ["address", "phoneNumber"];
        for (const key of required) {
          if (!shipping[key].trim()) {
            alert("Oops! You missed a required field. Even pirates need an address to deliver treasure!");
            return;
          }
        }

        if(!cartItems || cartItems.length === 0){
            alert("Your cart is emptier than my fridge on payday!");
            return;
        }

        try{
            let is_login = null
            if (user){
                is_login = user
            }
            const {data} = await api.post("/create-payment-session", {
                cartItems, shipping, is_login
            });
            window.location.href = data.url;
        }catch(error){
            console.error(error);
            alert("Yikes! Payment session failed. Gremlins in the system? Try again in a bit.");
        }
    }
    const orderTotal = cartSubtotal;

    if (!mounted) {
        return null;
    }

  return (
    <div>
        <PageHeader title = {"Shop Cart"} curPage={"Shop Cart"}/> 

        <div className='shop-cart padding-tb'>
            <div className='container'>
                <div className='section-wrapper'>
                    <div className='cart-top'>
                        <table>
                            <thead>
                                <tr>
                                    <th className="cat-product">Product</th>
                                    <th className="cat-price">Price</th>
                                    <th className="cat-quantity">Quantity</th>
                                    <th className="cat-toprice">Total</th>
                                    <th className="cat-edit">Edit</th>
                                </tr>
                            </thead>

                            <tbody>
                                {
                                    cartItems.map((item, index) => (
                                        <tr key = {index}>
                                            <td className='product-item cat-product'>
                                                <div className='p-thumb'>
                                                    <Link href={`/shop/${item.id.toString()}`}><img src = {Array.isArray(item.img) ? item.img[0] : item.img} alt = ""/></Link>
                                                </div>
                                                <div className='p-content'>
                                                    <Link href={`/shop/${item.id.toString()}`}>{item.name}</Link>
                                                </div>
                                            </td>

                                            <td className='cat-price'>${item.price}</td>
                                            <td className='cat-quantity'>
                                                <div className='cart-plus-minus'>
                                                    <div className='dec qtybutton' onClick={() => handleDecrease(item)}>-</div>
                                                    <input
                                                    type="text"
                                                    className="cart-plus-minus-box"
                                                    name="qtybutton"
                                                    value={item.qty}
                                                    min="0"
                                                    onChange={(e) => handleQuantityChange(item, e.target.value)}
                                                    />
                                                    <div className='inc qtybutton' onClick={() => handleIncrease(item)}>+</div>
                                                </div>
                                            </td>

                                            <td className='cat-toprice'>
                                                {`$${calculateTotalPrice(item)}`}
                                            </td>
                                            <td className='cat-edit'>
                                                <a onClick={() => handleRemoveItem(item)}>
                                                    🗑️
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>

                    <div className='cart-bottom'>


                        <div className='shiping-box'>
                            <div className='row'>
                                    <div className='calculate-shiping'>
                                        <h3>Contact & Shipping Information</h3>
                                        <input style={{ width: '100%' }} type="text" name="address" id="address" placeholder="Address*" className="cart-page-input-text" 
                                        value = {shipping.address} onChange={(e) => setShipping({...shipping, address: e.target.value})}/>

                                        <input style={{ width: '100%' }} type="text" name="postalCode" id="postalCode" placeholder="Postal Code / ZIP*" className="cart-page-input-text"
                                        value = {shipping.postalCode} onChange={(e) => setShipping({...shipping, postalCode: e.target.value})}/>

                                        {/* <input style={{ width: '100%' }} type="text" name="email" id="email" placeholder="Email*" className="cart-page-input-text"
                                        value = {shipping.email} onChange={(e) => setShipping({...shipping, email: e.target.value})}/> */}

                                        <input style={{ width: '100%' }} type="text" name="phoneNumber" id="phoneNumber" placeholder="Phone Number*" className="cart-page-input-text"
                                        value = {shipping.phoneNumber} onChange={(e) => setShipping({...shipping, phoneNumber: e.target.value})}/>

                                </div>

                                {/* <div className='col-md-6 col-12'> */}
                                    <div className='cart-overview'>
                                        <h3>Cart Totals</h3>
                                        <ul className='lab-ul'>
                                            <li>
                                                <span className='pull-left'>
                                                    Cart Subtotal
                                                </span>
                                                <p className='pull-right'>$ {cartSubtotal}</p>
                                            </li>
                                            <li>
                                                <span className='pull-left'>Shipping and Handling</span>
                                                <p className='pull-right'>Free Shipping</p>
                                            </li>
                                            <li>
                                                <span className='pull-left'>Order Total</span>
                                                <p className='pull-right'>$ {orderTotal.toFixed(2)}</p>
                                            </li>
                                        </ul>
                                    </div>
                                {/* </div> */}

                                <div>
                                        <form onSubmit={handleCheckout} className="w-full sm:w-auto">
                                            <button
                                            type="submit"
                                            className="w-full inline-flex items-center justify-center gap-2
                                                        px-6 py-3
                                                        rounded-lg
                                                        bg-emerald-600 hover:bg-emerald-700
                                                        text-white font-semibold tracking-wide
                                                        shadow-md hover:shadow-lg
                                                        transition active:scale-95">
                                            Proceed to Payment
                                            </button>
                                        </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </div>                            
    </div>
  )
}

export default CartPage