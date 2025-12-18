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
import PropTypes from 'prop-types';

export async function getServerSideProps(context) {
    const { params } = context;
    const { slug } = params;

    const productId = slug.substring(0, 24);
    const isValidId = /^[0-9a-fA-F]{24}$/.test(productId);

    if (!isValidId) {
        return {
            notFound: true,
        };
    }

    try {
        const { data } = await api.get(`/customers-product-get/${productId}`);
        const product = data.product;

        if (!product) {
            return {
                notFound: true,
            };
        }

        const expectedSlug = `${product._id}-${product.slug}`;
        if (slug !== expectedSlug) {
            return {
                redirect: {
                    destination: `/shop/${expectedSlug}`,
                    permanent: true,
                },
            };
        }

        return {
            props: {
                serverProduct: product,
            }
        }
    } catch (error) {
        console.error("SSR Error fetching product:", error.message);
        return {
            notFound: true,
        };
    }
}

const SingleProduct = ({ serverProduct }) => {
    const [productData, setProduct] = useState(serverProduct);
    const [loading, setLoading] = useState(!serverProduct);
    const [errorMsg, setErrorMsg] = useState('');

    const [reviewList, setReviewList] = useState([])
    const [reviewPage, setReviewPage] = useState(1)
    const [reviewTotalPages, setReviewTotalPages] = useState(1)
    const [reviewTotalCount, setReviewTotalCount] = useState(0)
    const [previewImage, setPreviewImage] = useState(null)

    const router = useRouter();

    const REVIEW_PAGE_SIZE = 10;

    const fetchReviews = async (_id, page = 1) => {
        try {
            const { data } = await api.get(`/get-reviews/${_id}`, {
                withCredentials: true,
                params: { page, limit: REVIEW_PAGE_SIZE },
            })
            setReviewList(data.reviewList || [])
            setReviewPage(data.page || page)
            setReviewTotalPages(data.totalPages || 1)
            setReviewTotalCount(data.totalReviews || 0)
        } catch (err) {
            console.log(err?.response?.data?.message || err.message)
        }
    }

    const handleReviewPageChange = (page) => {
        if (!productData?._id || page === reviewPage || page < 1 || page > reviewTotalPages) {
            return
        }
        setReviewPage(page)
        fetchReviews(productData._id, page)
    }

    useEffect(() => {
        if (serverProduct) {
            setProduct(serverProduct);
            fetchReviews(serverProduct._id, 1);
            setLoading(false);
        } else {
            setErrorMsg("Product data missing");
        }
    }, [serverProduct])

    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-gray-300 border-t-emerald-500 rounded-full animate-spin"></div>
                <p className="text-lg font-medium text-gray-700">Loading product...</p>
            </div>
        )
    }

    if (!productData) return (
        <div className="w-full h-screen flex items-center justify-center">
            <p className="text-xl font-bold text-red-500">{errorMsg || "Product Not Found."}</p>
        </div>
    )

    const fallbackDescription =
        productData?.description || `${productData.name} available at A Figure A Day.`
    const firstImage = productData?.images?.[0] || '/images/logo/myLogoResize.png'
    const priceNumber = productData?.colorPrices?.[0] ?? productData?.price ?? 0
    const priceCurrency = 'USD'
    const availability =
        productData?.stock > 0
            ? 'http://schema.org/InStock'
            : 'http://schema.org/OutOfStock'

    const productUrl = `https://www.afigureaday.com/shop/${productData._id}-${productData.slug}`

    const productStructuredData = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: productData.name,
        description: fallbackDescription,
        image: productData?.images?.length ? productData.images : [firstImage],
        sku: productData._id,
        url: productUrl,
        offers: {
            '@type': 'Offer',
            priceCurrency,
            price: priceNumber,
            availability,
            url: productUrl,
        },
        aggregateRating: productData.averageRating
            ? {
                '@type': 'AggregateRating',
                ratingValue: productData.averageRating,
                reviewCount: productData.reviewCount || productData.reviews?.length || 0,
            }
            : undefined,
    }

    return (
        <div>
            <SEO
                title={`${productData.name} | A Figure A Day`}
                description={fallbackDescription}
                canonical={productUrl}
                keywords={productData.name}
                image={firstImage}
                structuredData={productStructuredData}
            />
            <PageHeader title={"OUR SHOP"} curPage={productData.name} additionalLink={[{ label: "Shop", path: "/shop/direct-store" }]} />
            <div className='shop-single padding-tb aside-bg'>
                <div className='container'>
                    <div className='row justify-content-center'>
                        <div className="col-lg-8 col-12">
                            <article>
                                <div className='product-details'>
                                    <div className='row align-items-center'>
                                        <div className='col-md-6 col-12'>
                                            <div className='product-thumb relative'>
                                                <DiscountBadge discount={productData.discount} />
                                                <ProductSwiper images={productData.images} videos={productData.videos} previewImage={previewImage} onPreviewEnd={() => setPreviewImage(null)} />
                                            </div>
                                        </div>

                                        <div className='col-md-6 col-12'>
                                            <div className='post-content'>
                                                <ProductDisplay item={productData} onSelectImage={setPreviewImage} />
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
                                            fetchReviews(productData._id, 1)
                                        }}
                                    />
                                </div>
                            </article>
                        </div>

                        <div className="col-lg-4 col-12">
                            <aside className='ps-lg-4'>
                                <PopularPost />
                                {/* <Tags/> */}
                            </aside>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

SingleProduct.propTypes = {
    serverProduct: PropTypes.object,
};

export default SingleProduct
