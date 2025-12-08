import React, { useState, useEffect, useContext } from 'react'
import PageHeader from '../../components/PageHeader';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from "../../context/CartContext"

import api from './../../src/api/api';
import { AuthContext } from '../../context/AuthContext';
import SEO from '../../components/SEO';
import { ensureHttps } from '../../src/utils/imageUtils';

const CartPage = () => {
    const { cart: cartItems, add, remove, clear, handleQuantityChange } = useCart();
    const { user, setUser, loading } = useContext(AuthContext);

    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);

    const [shipping, setShipping] = useState({
        address: "", phoneNumber: ""
    });
    const [coupon, setCoupon] = useState({ code: '', discount: 0, id: null });
    const [couponError, setCouponError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('stripe');

    // Validation Logic
    const destinations = new Set(cartItems.map(item => item.shippingDestination || 'both'));
    const hasCanadaOnly = destinations.has('canada_only');
    const hasUsOnly = destinations.has('us_only');
    const isMixedConflict = hasCanadaOnly && hasUsOnly;

    let cartCurrency = 'USD';
    if (hasCanadaOnly) {
        cartCurrency = 'CAD';
    }

    const USD_TO_CAD_RATE = 1.35;

    const calculateTotalPrice = (item) => {
        let price = item.price - (item.price * (item.discount || 0)) / 100;

        // Frontend conversion logic: If cart is CAD, convert USD items (both) to CAD
        // If item is 'both' (USD) and cart is CAD
        if (cartCurrency === 'CAD' && (item.shippingDestination === 'both' || !item.shippingDestination)) {
            price = price * USD_TO_CAD_RATE;
        }

        return price * item.qty
    }

    const handleIncrease = (item) => add(item, 1);
    const handleDecrease = (item) => add(item, -1);
    const handleRemoveItem = (item) => remove(item.cartId);

    const cartSubtotal = cartItems.reduce(
        (t, i) => t + calculateTotalPrice(i), 0
    )

    const handleApplyCoupon = async () => {
        if (!coupon.code.trim()) return;
        try {
            const { data } = await api.post('/coupon-apply', { code: coupon.code });
            setCoupon({ code: coupon.code, discount: data.discount, id: data.couponId });
            setCouponError('');
        } catch (err) {
            setCoupon({ code: '', discount: 0, id: null });
            setCouponError(err.response?.data?.error || 'Invalid coupon');
        }
    };


    const handleCheckout = async (e) => {
        e.preventDefault();

        const required = ["address", "phoneNumber"];
        for (const key of required) {
            if (!shipping[key].trim()) {
                alert("Oops! You missed a required field. Even pirates need an address to deliver treasure!");
                return;
            }
        }

        if (!cartItems || cartItems.length === 0) {
            alert("Your cart is emptier than my fridge on payday!");
            return;
        }

        if (isMixedConflict) {
            alert("Your cart contains items that ship to Canada Only and items that ship to US Only. Please separate your orders to proceed.");
            return;
        }

        try {
            let is_login = null
            if (user) {
                is_login = user
            }

            if (paymentMethod === 'paypal') {
                const { data } = await api.post("/create-paypal-payment", {
                    cartItems, shipping, is_login, couponId: coupon.id, discount: coupon.discount
                });
                window.location.href = data.url;
            } else {
                const { data } = await api.post("/create-payment-session", {
                    cartItems, shipping, is_login, couponId: coupon.id, discount: coupon.discount
                });
                window.location.href = data.url;
            }
        } catch (error) {
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
            <SEO
                title="Shopping Cart | A Figure A Day"
                description="Review your cart and proceed to checkout for curated anime figures from A Figure A Day."
                canonical="https://www.afigureaday.com/cart-page"
                noindex
            />
            <PageHeader title={"Shop Cart"} curPage={"Shop Cart"} />

            <div className='shop-cart padding-tb'>
                <div className='container'>
                    <div className='section-wrapper'>
                        <div className='cart-top'>
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th style={{ textAlign: "center", verticalAlign: "middle" }}>Color</th>
                                        <th style={{ textAlign: "center", verticalAlign: "middle" }}>Size</th>
                                        <th style={{ textAlign: "center", verticalAlign: "middle" }}>Type</th>
                                        <th style={{ textAlign: "center", verticalAlign: "middle" }}>Price</th>
                                        <th style={{ textAlign: "center", verticalAlign: "middle" }}>Quantity</th>
                                        <th style={{ textAlign: "center", verticalAlign: "middle" }}>Total</th>
                                        <th style={{ textAlign: "center", verticalAlign: "middle" }}>Edit</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {
                                        cartItems.map((item) => (
                                            <tr key={item.cartId}>
                                                <td className='product-item cat-product'>
                                                    <div className='p-thumb'>
                                                        <Link href={`/shop/${item.id.toString()}`}>
                                                            <Image
                                                                src={ensureHttps(Array.isArray(item.img) ? item.img[0] : item.img)}
                                                                alt={item.name || "Product"}
                                                                width={85}
                                                                height={85}
                                                                style={{ width: '100%', height: 'auto' }}
                                                            />
                                                        </Link>
                                                    </div>
                                                    <div className='p-content'>
                                                        <Link href={`/shop/${item.id.toString()}`}>{item.name}</Link>
                                                    </div>
                                                </td>

                                                <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                                                    {item.color || '-'}
                                                </td>
                                                <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                                                    {item.size || '-'}
                                                </td>
                                                <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                                                    {item.type || '-'}
                                                </td>

                                                <td className='cat-price' style={{ textAlign: "center", verticalAlign: "middle" }}>
                                                    ${(item.price - (item.price * (item.discount || 0)) / 100).toFixed(2)}
                                                </td>

                                                <td className='cat-quantity' style={{ textAlign: "center", verticalAlign: "middle" }}>
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

                                                <td className='cat-toprice' style={{ textAlign: "center", verticalAlign: "middle" }}>
                                                    {`$${calculateTotalPrice(item).toFixed(2)}`}
                                                </td>
                                                <td className='cat-edit' style={{ textAlign: "center", verticalAlign: "middle" }}>
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
                                            value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} />

                                        <input style={{ width: '100%' }} type="text" name="postalCode" id="postalCode" placeholder="Postal Code / ZIP*" className="cart-page-input-text"
                                            value={shipping.postalCode} onChange={(e) => setShipping({ ...shipping, postalCode: e.target.value })} />

                                        {/* <input style={{ width: '100%' }} type="text" name="email" id="email" placeholder="Email*" className="cart-page-input-text"
                                        value = {shipping.email} onChange={(e) => setShipping({...shipping, email: e.target.value})}/> */}

                                        <input style={{ width: '100%' }} type="text" name="phoneNumber" id="phoneNumber" placeholder="Phone Number*" className="cart-page-input-text"
                                            value={shipping.phoneNumber} onChange={(e) => setShipping({ ...shipping, phoneNumber: e.target.value })} />

                                    </div>


                                    {/* <div className='col-md-6 col-12'> */}
                                    <div className='cart-overview'>
                                        <h3>Cart Totals</h3>
                                        <ul className='lab-ul'>
                                            <li>
                                                <span className='pull-left'>
                                                    Cart Subtotal
                                                </span>
                                                <p className='pull-right'>$ {cartSubtotal.toFixed(2)} {cartCurrency}</p>
                                            </li>
                                            <li>
                                                <span className='pull-left'>Shipping and Handling</span>
                                                <p className='pull-right'>Free Shipping</p>
                                            </li>
                                            <li>
                                                <span className='pull-left'>Order Total</span>
                                                <p className='pull-right'>$ {orderTotal.toFixed(2)} {cartCurrency}</p>
                                            </li>

                                        </ul>
                                        {isMixedConflict ? (
                                            <div style={{ marginBottom: '15px', marginTop: '15px', padding: '10px', backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '5px', color: '#b91c1c', fontSize: '0.9rem' }}>
                                                <p style={{ margin: 0, fontWeight: 'bold' }}>⚠️ Shipping Conflict:</p>
                                                <p style={{ margin: 0 }}>Your cart contains items restricted to Canada and items restricted to US. Please purchase them in separate orders.</p>
                                            </div>
                                        ) : (
                                            <div style={{ marginBottom: '15px', marginTop: '15px', padding: '10px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '5px', color: '#166534', fontSize: '0.9rem' }}>
                                                <p style={{ margin: 0, fontWeight: 'bold' }}>ℹ️ Currency Note:</p>
                                                <p style={{ margin: 0 }}>
                                                    {cartCurrency === 'CAD'
                                                        ? "Your order will be processed in Canadian Dollars (CAD) because it contains Canada-specific items."
                                                        : "Your order will be processed in US Dollars (USD)."}
                                                </p>
                                            </div>
                                        )}
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
                                        <div className="mb-3">
                                            <h3 className="text-lg font-semibold text-slate-800 mb-3">Select Payment Method</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <label
                                                    className={`relative flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200 ${paymentMethod === 'stripe'
                                                        ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600 shadow-sm'
                                                        : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="paymentMethod"
                                                        value="stripe"
                                                        checked={paymentMethod === 'stripe'}
                                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === 'stripe' ? 'border-emerald-600' : 'border-slate-400'
                                                        }`}>
                                                        {paymentMethod === 'stripe' && (
                                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="block font-semibold text-slate-800">Credit/Debit Card</span>
                                                        <span className="text-sm text-slate-500">Pay securely with Stripe</span>
                                                    </div>
                                                    <div className="text-2xl opacity-80">💳</div>
                                                </label>

                                                <label
                                                    className={`relative flex items-center gap-4 p-4 border rounded-xl cursor-pointer transition-all duration-200 ${paymentMethod === 'paypal'
                                                        ? 'border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600 shadow-sm'
                                                        : 'border-slate-200 hover:border-emerald-300 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="paymentMethod"
                                                        value="paypal"
                                                        checked={paymentMethod === 'paypal'}
                                                        onChange={(e) => setPaymentMethod(e.target.value)}
                                                        className="sr-only"
                                                    />
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${paymentMethod === 'paypal' ? 'border-emerald-600' : 'border-slate-400'
                                                        }`}>
                                                        {paymentMethod === 'paypal' && (
                                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <span className="block font-semibold text-slate-800">PayPal</span>
                                                        <span className="text-sm text-slate-500">Fast & easy checkout</span>
                                                    </div>
                                                    <div className="text-2xl opacity-80">🅿️</div>
                                                </label>
                                            </div>
                                        </div>

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
                                                {paymentMethod === 'paypal' ? 'Pay with PayPal' : 'Proceed to Payment'}
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
