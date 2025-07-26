import React from 'react'
import Link from 'next/link'
import Rating from "../../components/Rating"
import PropTypes from 'prop-types'
import { useCart } from '../../context/CartContext';
import {toast} from "react-hot-toast"
import api from '../../src/api/api';
import DiscountBadge from '../../components/DiscountBadge';

const ProductCards = ({GridList, products}) => {
  const {add} = useCart();

  const handleSubmit = (e, _product) => {
  const {
        _id,
        images,
        name,
        price,
        discount,
        colors = [],
        sizes = [],
      } = _product;

      const defaultColor = colors[0] || "";
      const defaultSize = sizes[0] || "";
      const defaultType = "";
    const product = {
      id: _id,
      cartId: `${_id}-${defaultColor}-${defaultSize}`,
      img: images,
      name: name,
      price: price,
      discount: discount,
      color: defaultColor,
      size: defaultSize,
    }

    e.preventDefault();
    add(product, 1)

    toast.success(
        `${1} × ${name} added to cart`,
        { duration: 2500 }     
    );
}

  const addWishlist = async(e, _product) => {
    const {_id, images, name, price} = _product;
    try{
      const res = await api.post("/add-to-wishlist", {productId: _id}, {withCredentials: true});
      toast.success(res.data?.message)
    }catch(error){
      toast.error(error.response?.data?.message || "Error adding to wishlist")
    }
  }

  return (
    <div className={`shop-product-wrap row justify-content-center ${GridList ? "grid" : "list"}`}>
        {
          products.map((product, i) => {
            const discountedPrice = (product.price - (product.price * product.discount) / 100).toFixed(2)
            return(
            <div key = {i} className='col-lg-4 col-md-6 col-12'>
                <div className='product-item'>
                  {/* product images */}
                  <div className='product-thumb'>
                    <div className='pro-thumb relative'>
                      <img src = { Array.isArray(product.images) ? product.images[0] : product.images} alt = ""/>
                      <DiscountBadge discount={product.discount} />
                      </div>

                      {/* product action link */}
                      <div className="product-action-link flex items-center gap-3">
                      <Link href={`/shop/${product._id.toString()}`}>
                        <i className="icofont-eye text-xl text-slate-700 transition-transform duration-200 hover:scale-125 hover:text-indigo-400" />
                      </Link>

                      <a onClick={(e) => addWishlist(e, product)}>
                        <i className="icofont-heart text-xl text-slate-700 transition-transform duration-200 hover:scale-125 hover:text-pink-400" />
                      </a>

                      <a onClick={(e) => handleSubmit(e, product)}>
                        <i className="icofont-cart-alt text-xl text-slate-700 transition-transform duration-200 hover:scale-125 hover:text-emerald-400" />
                      </a>
                    </div>
                  </div>

                  {/* product content */}
                  <div className='product-content'>
                    <h5>
                      <Link href = {`/shop/${product._id.toString()}`}>{product.name}</Link>
                    </h5>

                    <p className='productRating flex justify-center'>
                      <Rating rating={product.averageRating} number_of_ratings={product.reviewCount}/>
                    </p>
                    <h6>
                      {product.discount > 0 ? (
                        <>
                          ${discountedPrice}{` `}
                          <del className='text-sm text-gray-500 ml-1'>
                            ${product.price}
                          </del>
                        </>
                      ) : (
                        `$${product.price}`
                      )}
                    </h6>
                    </div>
              </div>

              {/* list style */}
              <div className='product-list-item'>
                  <div className='product-thumb'>
                    <div className='pro-thumb relative'>
                      <img src = { Array.isArray(product.images) ? product.images[0] : product.images}  alt = ""/>
                      <DiscountBadge discount={product.discount} />
                      </div>

                      <div className="product-action-link flex items-center gap-3">
                      <Link href={`/shop/${product._id.toString()}`}>
                        <i className="icofont-eye text-xl text-slate-700 transition-transform duration-200 hover:scale-125 hover:text-indigo-400" />
                      </Link>

                      <a onClick={(e) => addWishlist(e, product)}>
                        <i className="icofont-heart text-xl text-slate-700 transition-transform duration-200 hover:scale-125 hover:text-pink-400" />
                      </a>

                      <a onClick={(e) => handleSubmit(e, product)}>
                        <i className="icofont-cart-alt text-xl text-slate-700 transition-transform duration-200 hover:scale-125 hover:text-emerald-400" />
                      </a>
                    </div>
                  </div>

                  <div className='product-content'>
                    <h5>
                      <Link href = {`/shop/${product._id.toString()}`}>{product.name}</Link>
                    </h5>

                    <p className='productRating'>
                      <Rating rating={product.averageRating} number_of_ratings={product.reviewCount}/>
                    </p>
                    <h6>
                      {product.discount > 0 ? (
                        <>
                        ${discountedPrice}{` `}
                        <del className='text-sm text-gray-500 ml-1'>
                          ${product.price}
                        </del>
                        </>
                      ) : (
                        `$${product.price}`
                      )}
                    </h6>
                    </div>
              </div>
            </div>
            )
          })
        }
    </div>
  )
}

ProductCards.propTypes = {
  GridList: PropTypes.bool.isRequired,
  products: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      name: PropTypes.string.isRequired,
      img: PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired,
      price: PropTypes.number.isRequired,
    })
  ).isRequired,
}

ProductCards.defaultProps = {
  GridList: true,
  products: [],
};

export default ProductCards