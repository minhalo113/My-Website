// import Link from 'next/link';
// import Image from 'next/image';
// import PropTypes from 'prop-types';
// import { ensureHttps } from '../../src/utils/imageUtils';
// import { useState, useEffect } from 'react';
// import api from '../../src/api/api.js'

// const subTitle = "Celebrate Your Fandom";
// const title = "Find the Perfect Figure for Every Collection";

// const HomeCategory = () => {
//     const [categories, setCategories] = useState([])

//     useEffect(() => {
//         let mounted = true;
//         const loadCategories = async () => {
//             try {
//                 const response = await api.get('/customers-featured-categories', {
//                     params: { limit: 6 },
//                     withCredentials: true
//                 });
//                 if (mounted) {
//                     setCategories(response?.data?.categories || []);
//                 }
//             } catch (err) {
//                 console.log(err)
//             }
//         };

//         loadCategories();
//         return () => { mounted = false; }
//     }, [])
//     return (
//         <div className='category-section style-4 padding-tb'>
//             <div className="container">
//                 <div className='section-header text-center'>
//                     <span className='subtitle'>{subTitle}</span>
//                     <h2 className='title'>{title}</h2>
//                 </div>
//                 {/* section card */}
//                 <div className='section-wrapper' style={{ display: "flex", justifyContent: 'center' }}>
//                     <div className='row g-4 justify-content-center row-cols-md-3 row-cols-sm-2 row-cols-1' style={{ width: "100%" }}>
//                         {
//                             categories.slice(0, 6).map((val) => (
//                                 <div key={val.productId || val.category} className='col' style={{ display: "flex", justifyContent: 'center' }}>
//                                     <Link
//                                         href={{
//                                             pathname: '/shop',
//                                             query: val?.category ? { category: val.category } : {},
//                                         }}
//                                         className='category-item'
//                                         style={{ width: '100%', display: 'block' }}
//                                     >
//                                         <div className='category-inner'>
//                                             <div className='category-thumb relative' style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}>
//                                                 <Image
//                                                     src={ensureHttps(val.image)}
//                                                     alt={val.category}
//                                                     fill
//                                                     sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
//                                                     style={{ objectFit: 'cover' }}
//                                                 />
//                                             </div>

//                                             <div className='category-content'>
//                                                 <span>{val.category}</span>
//                                             </div>
//                                         </div>
//                                     </Link>
//                                 </div>
//                             )
//                             )
//                         }
//                     </div>
//                 </div>
//             </div>

//         </div>
//     )
// }

// HomeCategory.propTypes = {
//     categories: PropTypes.array,
// };

// export default HomeCategory
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import api from '../../src/api/api.js';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import { ensureHttps } from '../../src/utils/imageUtils';

import 'swiper/css';
import 'swiper/css/navigation';

const title = "Newest Arrivals";

const CompactProductCard = ({ product, type }) => {
    const { _id, slug, images, name, currency, effectivePrice, discount, affiliateLink } = product;

    // Determine the target link
    const productLink = `/shop/${_id}-${slug}`;
    const isAffiliate = type === 'affiliate';

    return (
        <div className="h-full bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300 flex flex-col">
            <div className="relative w-full aspect-square overflow-hidden rounded-t-lg bg-gray-50">
                <Link href={productLink}>
                    <Image
                        src={ensureHttps(Array.isArray(images) ? images[0] : images)}
                        alt={name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-contain hover:scale-105 transition-transform duration-300"
                    />
                </Link>
                {discount > 0 && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        -{discount}%
                    </span>
                )}
            </div>
            <div className="p-3 flex flex-col flex-grow justify-between gap-2">
                <div>
                    <Link href={productLink}>
                        <h6 className="text-sm font-medium text-gray-800 line-clamp-2 leading-tight hover:text-[#DCA54A] transition-colors">
                            {name}
                        </h6>
                    </Link>
                </div>
                <div className="flex items-center justify-between mt-auto">
                    <span className="text-[#DCA54A] font-bold text-sm">
                        ${currency} {effectivePrice}
                    </span>
                    {isAffiliate ? (
                        <a
                            href={affiliateLink || productLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] uppercase font-bold text-blue-500 hover:underline"
                        >
                            Global
                        </a>
                    ) : (
                        <span className="text-[10px] uppercase font-bold text-green-600">
                            Direct
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const ProductSection = ({ title, products, type }) => {
    if (!products || products.length === 0) return null;
    let isAffiliate = type === 'affiliate';
    return (
        <div className="w-full">
            <div className="flex items-center justify-between mb-3 px-1">
                <h5 className="text-md font-bold text-gray-700 uppercase tracking-wide border-l-4 border-[#DCA54A] pl-2">
                    {title}
                </h5>
                {isAffiliate ? (
                    <Link href="/shop/global-finds" className="text-xs font-semibold text-gray-500 hover:text-[#DCA54A]">
                        View All &rarr;
                    </Link>
                ) : (
                    <Link href="/shop/direct-store" className="text-xs font-semibold text-gray-500 hover:text-[#DCA54A]">
                        View All &rarr;
                    </Link>
                )}
            </div>
            <Swiper
                modules={[Autoplay, Navigation]}
                spaceBetween={12}
                slidesPerView={2}
                navigation={true}
                breakpoints={{
                    640: { slidesPerView: 3 },
                    768: { slidesPerView: 3 },
                    1024: { slidesPerView: 4 },
                    1280: { slidesPerView: 5 },
                }}
                className="pb-8"
                style={{ paddingBottom: '20px' }}
            >
                {products.map((product) => (
                    <SwiperSlide key={product._id} className="h-auto">
                        <CompactProductCard product={product} type={type} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

const HomeCategory = () => {
    const [standardProducts, setStandardProducts] = useState([]);
    const [affiliateProducts, setAffiliateProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        const loadProducts = async () => {
            try {
                const response = await api.get('/get-newest-products', {
                    withCredentials: true
                });
                if (mounted && response?.data) {
                    setStandardProducts(response.data.standardProducts || []);
                    setAffiliateProducts(response.data.affiliateProducts || []);
                }
            } catch (err) {
                console.log(err);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadProducts();
        return () => { mounted = false; };
    }, []);

    if (loading) return null;
    if (!standardProducts.length && !affiliateProducts.length) return null;

    return (
        <div className='category-section padding-tb' style={{ paddingTop: '40px', paddingBottom: '20px' }}>
            <div className="container">
                <div className='section-header text-center mb-6'>
                    <span className='subtitle text-[#DCA54A] font-semibold tracking-wider uppercase text-xs'>Fresh From The Source</span>
                    <h2 className='title text-2xl md:text-3xl font-bold text-gray-800'>{title}</h2>
                </div>

                <div className='section-wrapper flex flex-col gap-8'>
                    {/* Direct Store Section */}
                    {standardProducts.length > 0 && (
                        <ProductSection
                            title="Direct Store"
                            products={standardProducts}
                            type="standard"
                        />
                    )}

                    {/* Global Finds Section */}
                    {affiliateProducts.length > 0 && (
                        <ProductSection
                            title="Global Finds"
                            products={affiliateProducts}
                            type="affiliate"
                        />
                    )}
                </div>
            </div>
        </div>
    );
};

export default HomeCategory;
