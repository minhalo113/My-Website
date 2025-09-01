import React from 'react'
import { useState } from 'react';
import Link from 'next/link';
import PropTypes from 'prop-types';
import Rating from '../../components/Rating';
import { useCart } from '../../context/CartContext';
import {toast} from "react-hot-toast"
import api from '../../src/api/api';

const desc = "This is the detail of the product."


const ProductDisplay = ({item, onSelectImage}) => {
    const {name, _id, price, discount, seller, reviewCount, images, videos = [], stock, averageRating, deliveryTime, colors = [], colorImages = [], sizes = [], colorPrices = []} = item || {}

    const [prequantity, setQuantity] = useState(1);
    const [selectedColorIndex, setSelectedColorIndex] = useState(0);
    const [selectedSize, setSelectedSize] = useState(sizes[0] || '');

    const selectedColor = colors[selectedColorIndex] || '';


    const getOriginalPrice = () => {
        return colorPrices[selectedColorIndex] !== undefined ? colorPrices[selectedColorIndex] : price;
    };
    const getVariantPrice = () => {
        let p = getOriginalPrice();
        p = p - (p * discount) / 100;
        return p.toFixed(2);
    }

    const {add} = useCart();
    const addWishlist = async(e) => {
        e.preventDefault();
        try{
            const res = await api.post('/add-to-wishlist', {
                productId: _id,
                color: selectedColor,
                colorIndex: selectedColorIndex,
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
        const variantPrice = colorPrices[selectedColorIndex] !== undefined ? colorPrices[selectedColorIndex] : price;
        const variantImage = (colorImages.length > 0 && selectedColor) ? colorImages[selectedColorIndex] : images;

        const product = {
            id: _id,
            cartId: `${_id}-${selectedColorIndex}-${selectedSize || ''}`,
            img: variantImage,
            name: name,
            price: variantPrice,
            discount: discount,
            color: selectedColor,
            colorIndex: selectedColorIndex,
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
                        <div className="flex items-start gap-2">
                            <span className="font-medium">Option:</span>
                            {colorImages.length > 0 ? (
                                <div className="flex gap-2 flex-wrap flex-1">
                                    {colorImages.map((img,i) => (
                                        <div key={i} className="flex flex-col items-center w-10">
                                        <img
                                            src={img}
                                            onClick={() => {
                                                setSelectedColorIndex(i);
                                                onSelectImage && onSelectImage(img)
                                            }}
                                            className={`w-10 h-10 rounded cursor-pointer transition-all duration-200 ease-in-out ${
                                            selectedColorIndex === i
                                                ? 'border-4 border-emerald-500 ring-2 ring-emerald-300'
                                                : 'border border-gray-300'
                                            }`}
                                        />
                                        {selectedColorIndex === i && (
                                            <span className="text-xs font-bold text-black mt-1">
                                            {colors[i]}
                                            </span>
                                        )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <select value={selectedColorIndex} onChange={(e) => setSelectedColorIndex(parseInt(e.target.value, 10))} className="border border-slate-300 rounded px-2 py-1">
                                    {colors.map((c,i) => (
                                        <option key={i} value={i}>{c}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}

                    {sizes.length > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="font-medium">Size:</span>
                           <select
                                value={selectedSize}
                                onChange={(e) => setSelectedSize(e.target.value)}
                                className="border border-slate-300 rounded px-2 py-1 h-9 text-sm leading-tight"
                                >

                                {sizes.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                    )}

<div className="flex items-center gap-2">
  <span className="font-medium">Quantity:</span>
  <div className="flex items-center border rounded overflow-hidden w-max">
    <button
      type="button"
      onClick={handleDecrease}
      className="w-8 h-8 flex justify-center items-center text-xl font-bold border-r"
    >
      -
    </button>
    <input
      type="text"
      name="qtybutton"
      value={prequantity}
      onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
      className="w-12 text-center border-none outline-none"
    />
    <button
      type="button"
      onClick={handleIncrease}
      className="w-8 h-8 flex justify-center items-center text-xl font-bold border-l"
    >
      +
    </button>
  </div>
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

                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", gap: "0.75rem" }}>
                <button type="submit" className='lab-btn'
                style={{
                    flex: 1,
                    backgroundColor: '#059669', 
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    }}>
                    <span>Add to Cart</span>
                </button>

                <button
                    type="button"
                    onClick={addWishlist}
                    className="lab-btn text-white"
                    style={{
                        flex: 1,
                        backgroundColor: '#f97316', 
                        color: 'white',
                        padding: '0.5rem 1rem',
                        borderRadius: '0.375rem',
                        border: 'none',
                        fontWeight: '600',
                        fontSize: '14px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'pointer',
                        }}
                >
                    <span>Add to Wishlist</span>
                </button>

                <Link href="/cart-page" className='lab-btn bg-primary'     style={{
                    flex: 1,
                    backgroundColor: '#3b82f6', // Tailwind blue-500
                    color: 'white',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.375rem',
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '14px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    }}>
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
    onSelectImage: PropTypes.func
};

export default ProductDisplay;