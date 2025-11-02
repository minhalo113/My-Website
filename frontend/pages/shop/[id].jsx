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
    const [reviewPage, setReviewPage] = useState(1)
    const [reviewTotalPages, setReviewTotalPages] = useState(1)
    const [reviewTotalCount, setReviewTotalCount] = useState(0)
    const [previewImage, setPreviewImage] = useState(null)
    
    const router = useRouter();
    const {id} = router.query;

    const REVIEW_PAGE_SIZE = 10;

    const fetchProduct = async(_id) => {
        try{
            const {data} = await api.get(`/customers-product-get/${_id}`, {withCredentials: true})
            setProduct(data.product);
        }catch(err){
            console.log(err.response.data.message)
        }
    }

    const fetchReviews = async(_id, page = 1) => {
        try{
            const { data } = await api.get(`/get-reviews/${_id}`, {
                withCredentials: true,
                params: { page, limit: REVIEW_PAGE_SIZE },
            })
            setReviewList(data.reviewList || [])
            setReviewPage(data.page || page)
            setReviewTotalPages(data.totalPages || 1)
            setReviewTotalCount(data.totalReviews || 0)
        }catch(err){
            console.log(err?.response?.data?.message || err.message)
        }
    }

    const fetchData = async(_id) => {
        setLoading(true)
        try {
            await Promise.all([fetchProduct(_id), fetchReviews(_id, 1)])
        } finally {
            setLoading(false)
        }
    }

    const handleReviewPageChange = (page) => {
        if (!id || page === reviewPage || page < 1 || page > reviewTotalPages) {
            return
        }
        setReviewPage(page)
        fetchReviews(id, page)
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
            title={`${productData.name} | A Figure A Day`}
            description={productData.description}
            canonical={`https://www.afigureaday.com/product/${productData._id}`}
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
                                                                                                <ProductSwiper images={productData.images} videos={productData.videos} previewImage={previewImage} onPreviewEnd={() => setPreviewImage(null)}/>
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
                                <Review
                                    item={productData}
                                    reviewList={reviewList}
                                    page={reviewPage}
                                    totalPages={reviewTotalPages}
                                    totalReviews={reviewTotalCount}
                                    onPageChange={handleReviewPageChange}
                                    reloadFunction={() => {
                                        setReviewPage(1)
                                        fetchReviews(id, 1)
                                    }}
                                />
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