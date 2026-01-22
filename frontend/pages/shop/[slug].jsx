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

    // Case 1: Invalid ID format -> Return null to show unavailable message
    if (!isValidId) {
        return {
            props: {
                serverProduct: null,
            }
        };
    }

    try {
        const { data } = await api.get(`/customers-product-get/${productId}`);
        const product = data.product;

        // Case 2: Product not found in DB -> Return null
        if (!product) {
            return {
                props: {
                    serverProduct: null,
                }
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
        console.error("SSR Error fetching product:", error);
        // Case 3: API Error -> Return null so user sees the message instead of a crash
        return {
            props: {
                serverProduct: null,
            }
        };
    }
}

const SingleProduct = ({ serverProduct }) => {
    const router = useRouter();

    // 1. Logic: If no product came from server, show Unavailable Message immediately
    if (!serverProduct) {
        return (
            <div>
                <PageHeader title={"Product Not Found"} curPage={"Unavailable"} />
                <div className="w-full h-[60vh] flex flex-col items-center justify-center gap-6 p-4">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-800 mb-2">Product Unavailable</h2>
                        <p className="text-lg text-gray-600 mb-6">
                            This product is no longer available or has been removed.
                        </p>
                        <button
                            // onClick={() => router.push('/shop')}
                            onClick={() => router.push('/shop/direct-store')}
                            className="px-8 py-3 bg-yellow-500 text-white font-bold rounded hover:bg-yellow-600 transition-colors duration-300"
                        >
                            Return to Shop
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. State Initialization (Only runs if product exists)
    const [productData, setProduct] = useState(serverProduct);
    const [reviewList, setReviewList] = useState([]);
    const [reviewPage, setReviewPage] = useState(1);
    const [reviewTotalPages, setReviewTotalPages] = useState(1);
    const [reviewTotalCount, setReviewTotalCount] = useState(0);
    const [previewImage, setPreviewImage] = useState(null);

    const REVIEW_PAGE_SIZE = 10;

    const fetchReviews = async (_id, page = 1) => {
        try {
            const { data } = await api.get(`/get-reviews/${_id}`, {
                withCredentials: true,
                params: { page, limit: REVIEW_PAGE_SIZE },
            });
            setReviewList(data.reviewList || []);
            setReviewPage(data.page || page);
            setReviewTotalPages(data.totalPages || 1);
            setReviewTotalCount(data.totalReviews || 0);
        } catch (err) {
            console.log(err?.response?.data?.message || err.message);
        }
    };

    const handleReviewPageChange = (page) => {
        if (!productData?._id || page === reviewPage || page < 1 || page > reviewTotalPages) {
            return;
        }
        setReviewPage(page);
        fetchReviews(productData._id, page);
    };

    // 3. Effects
    useEffect(() => {
        if (serverProduct) {
            setProduct(serverProduct);
            fetchReviews(serverProduct._id, 1);
        }
    }, [serverProduct]);

    // 4. Derived Values & Render Helpers
    const fallbackDescription = productData?.description || `${productData.name} available at A Figure A Day.`;
    const firstImage = productData?.images?.[0] || '/images/logo/myLogoResize.png';
    const priceNumber = productData?.colorPrices?.[0] ?? productData?.price ?? 0;
    const priceCurrency = 'USD';
    const availability = productData?.stock > 0 ? 'http://schema.org/InStock' : 'http://schema.org/OutOfStock';
    const productUrl = `https://www.afigureaday.com/shop/${productData._id}-${productData.slug}`;

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
    };

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
            {/* <PageHeader title={"OUR SHOP"} curPage={productData.name} additionalLink={[{ label: "Shop", path: "/shop" }]} /> */}
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
                                                <ProductSwiper
                                                    images={productData.images}
                                                    videos={productData.videos}
                                                    previewImage={previewImage}
                                                    onPreviewEnd={() => setPreviewImage(null)}
                                                />
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
                                            setReviewPage(1);
                                            fetchReviews(productData._id, 1);
                                        }}
                                    />
                                </div>
                            </article>
                        </div>

                        <div className="col-lg-4 col-12">
                            <aside className='ps-lg-4'>
                                <PopularPost />
                            </aside>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

SingleProduct.propTypes = {
    serverProduct: PropTypes.object,
};

export default SingleProduct;