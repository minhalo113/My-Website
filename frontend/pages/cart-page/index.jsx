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
    const [coupon, setCoupon] = useState({code: '', discount: 0, id: null});
    const [couponError, setCouponError] = useState('');

    const calculateTotalPrice = (item) => {
        const price = item.price - (item.price * (item.discount || 0))/ 100;
        return price * item.qty
    }

    const handleIncrease = (item) => add(item, 1);
    const handleDecrease = (item) => add(item, -1);
    const handleRemoveItem = (item) => remove(item.id);

    const cartSubtotal = cartItems.reduce(
        (t, i) => t + calculateTotalPrice(i), 0
    )

    const handleApplyCoupon = async () => {
        if(!coupon.code.trim()) return;
        try {
            const {data} = await api.post('/coupon-apply', {code: coupon.code});
            setCoupon({code: coupon.code, discount: data.discount, id: data.couponId});
            setCouponError('');
        }catch(err){
            setCoupon({code: '', discount: 0, id: null});
            setCouponError(err.response?.data?.error || 'Invalid coupon');
        }
    };


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
                cartItems, shipping, is_login, couponId: coupon.id, discount: coupon.discount
            });
            window.location.href = data.url;
        }catch(error){
            console.error(error);
            alert("Yikes! Payment session failed. Gremlins in the system? Try again in a bit.");
        }
    }
    const orderTotal = cartSubtotal - (cartSubtotal * coupon.discount) / 100;

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
                                    <th>Color</th>
                                    <th>Size</th>
                                    <th>Type</th>
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

                                            <td>
                                                {item.color || '-'}
                                            </td>
                                            <td>
                                                {item.size || '-'}
                                            </td>
                                            <td>
                                                {item.type || '-'}
                                            </td>

                                            <td className='cat-price'>
                                                ${ (item.price - (item.price * (item.discount || 0)) / 100).toFixed(2) }
                                            </td>

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
                                            {`$${calculateTotalPrice(item).toFixed(2)}`}
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
                                                 <p className='pull-right'>$ {cartSubtotal.toFixed(2)}</p>
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
                                <div className="mt-10 space-y-3 bg-[#f8fafc] p-5 rounded-md shadow-md border border-slate-300">
                                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Apply Coupon</h3>
                                    
                                    <div className="flex flex-col sm:flex-row gap-3 items-center mb-20">
                                        <input
                                        type="text"
                                        placeholder="Enter coupon code"
                                        className="w-full sm:flex-1 px-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                        value={coupon.code}
                                        onChange={(e) => setCoupon({ ...coupon, code: e.target.value })}
                                        />
                                        <button
                                        type="button"
                                        onClick={handleApplyCoupon}
                                        className="px-5 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition font-medium"
                                        >
                                        Apply
                                        </button>

                                        
                                    </div>
                                    {coupon.discount > 0 && (
                                        <li
                                            style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            fontWeight: '500',
                                            color: '#16a34a', // emerald-600
                                            }}
                                        >
                                            <span style={{ fontWeight: 'bold' }}>Coupon Discount</span>
                                            <span style={{ margin: 0, fontWeight: 'bold' }}>- {coupon.discount}%</span>
                                        </li>
                                        )}

                                        {couponError && (
                                        <p
                                            style={{
                                            color: '#dc2626', 
                                            fontSize: '0.875rem',
                                            marginTop: '0.5rem',
                                            }}
                                        >
                                            {couponError}
                                        </p>
                                        )}
                                </div>

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

export default CartPage;