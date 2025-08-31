import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router';
import PageHeader from '../../components/PageHeader';
import ProductSwiper from "./MyCustomSwiper"
import ProductDisplay from './ProductDisplay';
import Review from './Review';
import PopularPost from './PopularPost';
import api from '../../src/api/api.js';
import DiscountBadge from '../../components/DiscountBadge.jsx';
import SEO from '../../components/SEO';

const SingleProduct = () => {
    const [productData, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    
    const [reviewList, setReviewList] = useState([])
    const [previewImage, setPreviewImage] = useState(null)
    
    const router = useRouter();
    const {id} = router.query;

    const fetchData = async(_id) => {
        try{
            let {data} = await api.get(`/customers-product-get/${_id}`, {withCredentials: true})
            setProduct(data.product);
            let reviewRes = await api.get(`/get-reviews/${_id}`, {withCredentials: true})
            setReviewList(reviewRes.data.reviewList);

        }catch(err){
            console.log(err.response.data.message)
        }finally{
            setLoading(false)
        }
    }

    useEffect(() =>{
        if(!id) return;
        fetchData(id);
    }, [id])

    if(loading) return <p>Loading product detials...</p>
    if (!productData) return <p>Product Not Found.</p>

  return (
    <div>
        <SEO
            title={`${productData.name} | Toy Haven Store`}
            description={productData.description}
            canonical={`https://www.toyhaven.store/product/${productData._id}`}
            keywords={productData.name}
            image={productData?.images?.[0]}
        />
        <PageHeader title = {"OUR SHOP"} curPage = {productData.name} additionalLink={[{label: "Shop", path : "/shop"}]}/>
        <div className='shop-single padding-tb aside-bg'>
            <div className='container'>
                <div className='row justify-content-center'>
                    <div className = "col-lg-8 col-12">
                        <article>
                            <div className='product-details'>
                                <div className='row align-items-center'>
                                <div className='col-md-6 col-12'>
                                        <div className='product-thumb relative'>
                                            <DiscountBadge discount={productData.discount} />
                                            <div className='swiper-container pro-single-top'>
                                                <ProductSwiper images={productData.images} previewImage={previewImage} onPreviewEnd={() => setPreviewImage(null)}/>
                                            </div>
                                        </div>
                                    </div>

                                    <div className='col-md-6 col-12'>
                                        <div className='post-content'>
                                            <ProductDisplay item = {productData} onSelectImage={setPreviewImage}/>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className='review'>
                                <Review item = {productData} reviewList = {reviewList} reloadFunction = {() => fetchData(id)}/>
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