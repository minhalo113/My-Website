import React from 'react'
import { useState } from 'react';
import Link from 'next/link';
import PropTypes from 'prop-types';
import Rating from '../../components/Rating';
import { useCart } from '../../context/CartContext';
import {toast} from "react-hot-toast"
import api from '../../src/api/api';

const desc = "This is the detail of the product."


const ProductDisplay = ({item}) => {
    const {name, _id, price, discount, seller, reviewCount, images, videos = [], stock, description, averageRating, deliveryTime, colors = [], colorImages = [], sizes = [], colorPrices = {}} = item || {}
    const getOriginalPrice = () => {
        return selectedColor && colorPrices[selectedColor] !== undefined ? colorPrices[selectedColor] : price;
    };
    const getVariantPrice = () => {
        let p = getOriginalPrice();
        p = p - (p * discount) / 100;
        return p.toFixed(2);
    }

    const [prequantity, setQuantity] = useState(1);
    const [selectedColor, setSelectedColor] = useState(colors[0] || '')
    const [selectedSize, setSelectedSize] = useState(sizes[0] || '')

    const {add} = useCart();
    const addWishlist = async(e) => {
        e.preventDefault();
        try{
            const res = await api.post('/add-to-wishlist', {
                productId: _id,
                color: selectedColor,
                size: selectedSize
            }, {withCredentials: true});
            toast.success(res.data?.message || 'Added to wishlist');
        }catch(err){
            toast.error(err.response?.data?.message || 'Error adding to wishlist');
        }
    };

    const handleDecrease = () => {
        if(prequantity > 1){
            setQuantity(prequantity - 1)
        }
    }

    const handleIncrease = () =>{
        setQuantity(prequantity + 1)
    }

    const handleSubmit = (e) => {
        const variantPrice = selectedColor && colorPrices[selectedColor] !== undefined ? colorPrices[selectedColor] : price;
        const product = {
            id: _id,
            cartId: `${_id}-${selectedColor || ''}-${selectedSize || ''}`,
            img: images,
            name: name,
            price: variantPrice,
            discount: discount,
            color: selectedColor,
            size: selectedSize,
        }

        e.preventDefault();
        add(product, prequantity)

        toast.success(
            `${prequantity} × ${name} added to cart`,
            { duration: 2500 }     
        );
    }

  return (
    <div>
        <div>
            <h4>{name}</h4>
            <Rating rating={averageRating} number_of_ratings={reviewCount}/>
            <h4>
                {discount > 0 ? (
                    <>
                        ${getVariantPrice()}{``}
                        <del className='text-sm text-gray-500 ml-1'>${getOriginalPrice().toFixed(2)}</del>
                    </>
                ) : (
                    `$${getVariantPrice()}`
                )}
            </h4>
            <h6>{seller}</h6>
            {/* <p style={{ whiteSpace: 'pre-line' }}>{description}</p> */}
        </div>

        {videos.length > 0 && (
            <div className="my-4">
                {videos.map((v,i) => (
                    <video key={i} controls className="w-full mb-2">
                        <source src={v} type="video/mp4" />
                    </video>
                ))}
            </div>
        )}

        <div>
            <form onSubmit={handleSubmit}>

                <div className="flex flex-col gap-4">

                    { (colorImages.length > 0 || colors.length > 0) && (
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Option:</span>
                            {colorImages.length > 0 ? (
                                <div className="flex gap-2">
                                    {colorImages.map((img,i) => (
                                        <div key={i} className="flex flex-col items-center w-10">
                                        <img
                                            src={img}
                                            onClick={() => setSelectedColor(colors[i] || '')}
                                            className={`w-10 h-10 rounded cursor-pointer transition-all duration-200 ease-in-out ${
                                            selectedColor === colors[i]
                                                ? 'border-4 border-emerald-500 ring-2 ring-emerald-300'
                                                : 'border border-gray-300'
                                            }`}
                                        />
                                        {selectedColor === colors[i] && (
                                            <span className="text-xs font-bold text-black mt-1">
                                            {selectedColor}
                                            </span>
                                        )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="border border-slate-300 rounded px-2 py-1">
                                    {colors.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {sizes.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Size:</span>
                            <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="border border-slate-300 rounded px-2 py-1">
                                {sizes.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="cart-plus-minus">
                        <div className="dec qtybutton" onClick={handleDecrease}>-</div>
                        <input
                        className="cart-plus-minus-box"
                        type="text"
                        name="qtybutton"
                        id="qtybutton"
                        value={prequantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
                        />
                        <div className="inc qtybutton" onClick={handleIncrease}>+</div>
                    </div>

                    {/* Stock display */}
                    {stock !== undefined && (
                        <div className="flex items-center gap-4 text-lg text-gray-800">
                        <i className="icofont-box text-3xl text-[#D09A40]" />
                        <span>
                            {stock > 10 ? (
                            <span className="text-green-600 font-semibold">In Stock: {stock} items</span>
                            ) : stock > 0 ? (
                            <span className="text-orange-500 font-bold">Hurry! Only {stock} left</span>
                            ) : (
                            <span className="text-red-600 font-extrabold">Out of stock</span>
                            )}
                        </span>
                        </div>
                    )}

                    {deliveryTime && (
                        <div className="flex items-center gap-4 text-lg text-gray-800">
                            <i className="icofont-truck-loaded text-3xl text-[#D09A40]" />
                            <span>Est. Delivery: {deliveryTime}</span>
                        </div>
                    )}
                 </div>

                <div style={{display: "flex", justifyContent: "space-between", width: "100%"}}>
                    <button type="submit" className='lab-btn'>
                        <span>Add to Cart</span>
                    </button>
                    <button type="button" onClick={addWishlist} className='lab-btn bg-emerald-600 text-white'>
                        <span>Add to Wishlist</span>
                    </button>
                    <Link href="/cart-page" className='lab-btn bg-primary'>
                        <span>Check Out</span>
                    </Link>
                </div>
            </form>
        </div>

    </div>
  )
}

ProductDisplay.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        price: PropTypes.number.isRequired,
        seller: PropTypes.string.isRequired,
        ratingsCount: PropTypes.number.isRequired,
        quantity: PropTypes.number.isRequired,
        images: PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired,
        colors: PropTypes.array,
        colorImages: PropTypes.array,
        sizes: PropTypes.array
    }).isRequired,
};

export default ProductDisplay;