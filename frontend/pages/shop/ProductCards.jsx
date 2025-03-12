import React from 'react'
import Link from 'next/link'
import Rating from "../../components/Rating"
import PropTypes from 'prop-types'

const ProductCards = ({GridList, products}) => {

  return (
    <div className={`shop-product-wrap row justify-content-center ${GridList ? "grid" : "list"}`}>
        {
          products.map((product, i) => (
            <div key = {i} className='col-lg-4 col-md-6 col-12'>
                <div className='product-item'>
                  {/* product images */}
                  <div className='product-thumb'>
                    <div className='pro-thumb'>
                      <img src = { Array.isArray(product.img) ? product.img[0] : product.img} alt = ""/>
                      </div>

                      {/* product action link */}
                      <div className='product-action-link'>
                        <Link href = {`/shop/${product.id}`}><i className='icofont-eye'></i></Link>

                        <a href='#'>
                          <i className='icofont-heart'></i>
                        </a>

                        <Link href = "/cart-page"><i className='icofont-cart-alt'></i></Link>
                        </div>
                  </div>

                  {/* product content */}
                  <div className='product-content'>
                    <h5>
                      <Link href = {`/shop/${product.id}`}>{product.name}</Link>
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
                      <img src = {product.img} alt = ""/>
                      </div>

                      <div className='product-action-link'>
                        <Link href = {`/shop/${product.id}`}><i className='icofont-eye'></i></Link>

                        <a href='#'>
                          <i className='icofont-heart'></i>
                        </a>

                        <Link href = "/cart-page"><i className='icofont-cart-alt'></i></Link>
                        </div>
                  </div>

                  <div className='product-content'>
                    <h5>
                      <Link href = {`/shop/${product.id}`}>{product.name}</Link>
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