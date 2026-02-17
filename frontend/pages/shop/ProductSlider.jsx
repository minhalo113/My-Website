import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Navigation } from 'swiper/modules';
import PropTypes from 'prop-types';
import { ensureHttps } from '../../src/utils/imageUtils';
import { US, CA } from 'country-flag-icons/react/3x2';

import 'swiper/css';
import 'swiper/css/navigation';

const SliderCard = ({ product }) => {
    const { _id, slug, images, name, productType, affiliateLink, shippingDestination, discount } = product;

    const productLink = `/shop/${_id}-${slug}`;
    const isAffiliate = productType === 'affiliate';
    const targetUrl = isAffiliate ? (affiliateLink || productLink) : productLink;

    const hasVariant = product.colors && product.colors.length > 0 && Array.isArray(product.colorPrices) && product.colorPrices.length > 0;
    let variantRange = null;
    if (hasVariant) {
        const prices = product.colors.map((c, idx) => product.colorPrices[idx]).filter(v => v !== undefined);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        variantRange = {
            minBase: min.toFixed(2),
            maxBase: max.toFixed(2),
            minDiscount: (min - (min * (discount || 0)) / 100).toFixed(2),
            maxDiscount: (max - (max * (discount || 0)) / 100).toFixed(2)
        };
    }
    const discountedPrice = (!hasVariant && (discount || 0) > 0) ? (product.price - (product.price * discount) / 100).toFixed(2) : null;

    let currencyLabel = 'USD';
    let shippingFlag = (
        <div className="flex items-center gap-1">
            <US className="w-4 h-auto" />
            <CA className="w-4 h-auto" />
        </div>
    );

    if (shippingDestination === 'canada_only') {
        shippingFlag = (
            <div className="flex items-center gap-1">
                <CA className="w-4 h-auto" />
            </div>
        );
        currencyLabel = 'CAD';
    } else if (shippingDestination === 'us_only') {
        shippingFlag = (
            <div className="flex items-center gap-1">
                <US className="w-4 h-auto" />
            </div>
        );
        currencyLabel = 'USD';
    }

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
                {(discount || 0) > 0 && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full z-10">
                        -{discount}%
                    </span>
                )}
                {!isAffiliate && (
                    <span className="absolute bottom-2 left-2 bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md z-10 opacity-90 flex items-center justify-center">
                        {shippingFlag}
                    </span>
                )}
                {isAffiliate ? (
                    <span className="absolute top-2 right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md z-10">
                        Check Deal ↗
                    </span>
                ) : (
                    <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-md z-10">
                        Direct Sale
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
                <div className="flex flex-col mt-auto">
                    <div className="flex items-baseline gap-1 flex-wrap">
                        {hasVariant ? (
                            (discount || 0) > 0 ? (
                                <>
                                    <span className="text-[#DCA54A] font-bold text-sm">${variantRange.minDiscount}</span>
                                    <del className="text-xs text-gray-400">${variantRange.minBase}</del>
                                    <span className="text-[#DCA54A] font-bold text-sm">- ${variantRange.maxDiscount}</span>
                                    <del className="text-xs text-gray-400">${variantRange.maxBase}</del>
                                </>
                            ) : (
                                <span className="text-[#DCA54A] font-bold text-sm">
                                    {variantRange.minBase === variantRange.maxBase ? `$${variantRange.minBase}` : `$${variantRange.minBase} - $${variantRange.maxBase}`}
                                </span>
                            )
                        ) : (discount || 0) > 0 ? (
                            <>
                                <span className="text-[#DCA54A] font-bold text-sm">${discountedPrice}</span>
                                <del className="text-xs text-gray-400">${product.price}</del>
                            </>
                        ) : (
                            <span className="text-[#DCA54A] font-bold text-sm">${product.price}</span>
                        )}
                        <span className="text-[10px] font-normal text-gray-500 ml-1">{currencyLabel}</span>
                    </div>
                    {isAffiliate && (
                        <div className="mt-1 flex justify-end">
                            <a
                                href={targetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] uppercase font-bold text-blue-500 hover:underline"
                            >
                                View Deal &rarr;
                            </a>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ProductSlider = ({ title, products }) => {
    if (!products || products.length === 0) return null;

    return (
        <div className="w-full mt-8 mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="text-xl font-bold text-gray-800 border-l-4 border-[#DCA54A] pl-3">
                    {title}
                </h3>
            </div>
            <Swiper
                modules={[Autoplay, Navigation]}
                spaceBetween={16}
                slidesPerView={2}
                navigation={true}
                breakpoints={{
                    640: { slidesPerView: 2 },
                    768: { slidesPerView: 3 },
                    1024: { slidesPerView: 4 },
                    1280: { slidesPerView: 5 },
                }}
                className="pb-8"
                style={{ paddingBottom: '30px' }}
            >
                {products.map((product) => (
                    <SwiperSlide key={product._id} className="h-auto">
                        <SliderCard product={product} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
};

ProductSlider.propTypes = {
    title: PropTypes.string.isRequired,
    products: PropTypes.array.isRequired,
};

export default ProductSlider;
