import React from 'react'
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import PropTypes from 'prop-types';
import { notFound } from 'next/navigation';

const desc = "This is the detail of the product."


const ProductDisplay = ({item}) => {
    const {name, id, price, seller, ratingsCount, quantity, img} = item || {};

    const [prequantity, setQuantity] = useState(quantity);
    // const [coupon, setCoupon] = useState("");
    const [size, setSize] = useState("Select Size")
    const [color, setColor] = useState("")

    const handleSizeChange = (e) => {
        setSize(e.target.value);
    } 

    const handleColorChange = (e) => {
        setColor(e.target.value);
    } 

    const handleDecrease = () => {
        if(prequantity > 1){
            setQuantity(prequantity - 1)
        }
    }

    const handleIncrease = () =>{
        setQuantity(prequantity + 1)
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const product = {
            id: id,
            img: img,
            name: name,
            price: price,
            quantity: prequantity,
            size: size,
            color: color,
        }

        const existingCart = JSON.parse(localStorage.getItem("cart")) || [];

        const existingProductIndex = existingCart.findIndex((item) => item.id === id);

        if(existingProductIndex !== -1){
            existingCart[existingProductIndex].quantity += prequantity;
        }else{
            existingCart.push(product);
        }
        localStorage.setItem("cart", JSON.stringify(existingCart))
        setQuantity(1);
        setSize("Select Size");
        setColor("Select Color");
    }

  return (
    <div>
        <div>
            <h4>{name}</h4>
            <p className='rating'>
                <i className='icofont-star'></i>
                <i className='icofont-star'></i>
                <i className='icofont-star'></i>
                <i className='icofont-star'></i>
                <i className='icofont-star'></i>
                <span> {ratingsCount} {ratingsCount===1 ? 'review' : 'reviews'}</span>
            </p>

            <h4>${price}</h4>
            <h6>{seller}</h6>
            <p>{desc}</p>
        </div>

        <div>
            <form onSubmit={handleSubmit}>
                <div className='select-product size'>
                    <select value={size} onChange={handleSizeChange}>
                        <option>Select Size</option>
                        <option value = "SM">SM</option>
                        <option value = "MD">MD</option>
                        <option value = "LG">LG</option>
                        <option value = "XL">XL</option>
                        <option value = "XXL">XXL</option>
                    </select>

                    <i className='icofont-rounded-down'></i>
                </div>

                <div className='select-product color'>
                    <select value={color} onChange={handleColorChange}>
                        <option>Select Color</option>
                        <option>Pink</option>
                        <option>Ash</option>
                        <option>Red</option>
                        <option>White</option>
                        <option>Blue</option>
                        <option>Black</option>
                    </select>

                    <i className='icofont-rounded-down'></i>
                </div>

                {/* quantity field */}
                <div className='cart-plus-minus'>
                    <div className='dec qtybutton' onClick = {handleDecrease}>-</div>
                        <input className = 'cart-plus-minus-box' type = "text" name = "qtybutton" id = "qtybutton" value={prequantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value, 10))}/>
                    <div className='inc qtybutton' onClick = {handleIncrease}>+</div>
                </div>

                {/* coupon field */}
                {/* <div className='discount-code mb-2'>
                    <input type='text' placeholder='Enter Discount Code' onChange={(e) => setCoupon(e.target.value)}/>
                </div> */}
                <div style= {{display: "flex", justifyContent: "space-between", width: "100%" }}>
                    {/* button section */}
                    <button type = "submit" className='lab-btn'>
                        <span>Add to Cart</span>
                    </button>
                    <Link href = "/cart-page" className='lab-btn bg-primary'>
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
        img: PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired,
    }).isRequired,
};

export default ProductDisplay