import React from 'react'
import Link from 'next/link'
import Rating from "../../components/Rating"
import PropTypes from 'prop-types'
import { useCart } from '../../context/CartContext';
import {toast} from "react-hot-toast"

const ProductCards = ({GridList, products}) => {
  const {add} = useCart();

  const handleSubmit = (e, _product) => {
    const {_id, images, name, price} = _product;
    const product = {
        id: _id,
        img: images,
        name: name,
        price: price
    }

    e.preventDefault();
    add(product, 1)

    toast.success(
        `${1} × ${name} added to cart`,
        { duration: 2500 }     
    );
}

  return (
    <div className={`shop-product-wrap row justify-content-center ${GridList ? "grid" : "list"}`}>
        {
          products.map((product, i) => (
            <div key = {i} className='col-lg-4 col-md-6 col-12'>
                <div className='product-item'>
                  {/* product images */}
                  <div className='product-thumb'>
                    <div className='pro-thumb'>
                      <img src = { Array.isArray(product.images) ? product.images[0] : product.images} alt = ""/>
                      </div>

                      {/* product action link */}
                      <div className='product-action-link'>
                        <Link href = {`/shop/${product._id.toString()}`}><i className='icofont-eye'></i></Link>

                        <a href='#'>
                          <i className='icofont-heart'></i>
                        </a>

                        <a onClick={(e) => handleSubmit(e, product)} href = "/cart-page"><i className='icofont-cart-alt'></i></a>
                        </div>
                  </div>

                  {/* product content */}
                  <div className='product-content'>
                    <h5>
                      <Link href = {`/shop/${product._id.toString()}`}>{product.name}</Link>
                    </h5>

                    <p className='productRating'>
                      <Rating/>
                    </p>
                    <h6>${product.price}</h6>
                    </div>
              </div>

              {/* list style */}
              <div className='product-list-item'>
                  <div className='product-thumb'>
                    <div className='pro-thumb'>
                      <img src = { Array.isArray(product.images) ? product.images[0] : product.images}  alt = ""/>
                      </div>

                      <div className='product-action-link'>
                        <Link href = {`/shop/${product._id.toString()}`}><i className='icofont-eye'></i></Link>

                        <a href='#'>
                          <i className='icofont-heart'></i>
                        </a>

                        <a onClick={(e) => handleSubmit(e, product)} href = "/cart-page"><i className='icofont-cart-alt'></i></a>
                        </div>
                  </div>

                  <div className='product-content'>
                    <h5>
                      <Link href = {`/shop/${product._id.toString()}`}>{product.name}</Link>
                    </h5>

                    <p className='productRating'>
                      <Rating/>
                    </p>
                    <h6>${product.price}</h6>
                    </div>
              </div>
            </div>
          ))
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