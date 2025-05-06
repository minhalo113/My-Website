import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import PageHeader from '../../components/PageHeader';

import { Swiper, SwiperSlide } from 'swiper/react';

import ProductSwiper from "./MyCustomSwiper"
import ProductDisplay from './ProductDisplay';
import Review from './Review';
import PopularPost from './PopularPost';
import api from '../../src/api/api.js';

const SingleProduct = () => {
    const [product, setProduct] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const router = useRouter();
    const {id} = router.query;

    useEffect(() =>{
        const fetchData = async() => {
            try{
                const allProducts = await api.get('/customers-products-get', {withCredentials: true})
    
                setProduct(allProducts.data.products);
            }catch(err){
                console.log(err)
            }finally{
                setLoading(false);
            }
        };
    
        fetchData();
    }, [id])

    const result = product.filter((p)=> p._id.toString() === id);
    const productData = result.length > 0 ? result[0] : null

    if(loading) return <p>Loading product detials...</p>
    if (!productData) return <p>Product Not Found.</p>

  return (
    <div>
        <PageHeader title = {"OUR SHOP"} curPage = {"Single Product"} additionalLink={[{label: "Shop", path : "/shop"}]}/>
        <div className='shop-single padding-tb aside-bg'>
            <div className='container'>
                <div className='row justify-content-center'>
                    <div className = "col-lg-8 col-12">
                        <article>
                            <div className='product-details'>
                                <div className='row align-items-center'>
                                    <div className='col-md-6 col-12'><div className='product-thumb'>
                                        <div className='swiper-container pro-single-top'>

                                            <ProductSwiper images = {productData.images}/>
                                        </div></div></div>

                                    <div className='col-md-6 col-12'>
                                        <div className='post-content'>
                                            <div>
                                                {
                                                    result.map(item => <ProductDisplay key = {item._id.toString()} item = {item}/>)
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='review'>
                                <Review/>
                            </div>
                        </article>
                    </div>



                    <div className = "col-lg-4 col-12">
                        <aside className='ps-lg-4'>
                            <PopularPost/>
                            {/* <Tags/> */}
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default SingleProduct