import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PropTypes from 'prop-types';
import { ensureHttps } from '../../src/utils/imageUtils';
import { US, CA } from 'country-flag-icons/react/3x2';

const RelatedProducts = ({ products }) => {
    if (!products || products.length === 0) return null;

    return (
        <div className='widget widget-post'>
            <div className='widget-header'>
                <h5 className='title'>Related Products</h5>
            </div>

            <ul className='widget-wrapper'>
                {products.map((product, i) => {
                    const hasVariant = product.colors && product.colors.length > 0 && Array.isArray(product.colorPrices) && product.colorPrices.length > 0;
                    let variantRange = null;
                    if (hasVariant) {
                        const prices = product.colors.map((c, idx) => product.colorPrices[idx]).filter(v => v !== undefined);
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        variantRange = {
                            minBase: min.toFixed(2),
                            maxBase: max.toFixed(2),
                            minDiscount: (min - (min * (product.discount || 0)) / 100).toFixed(2),
                            maxDiscount: (max - (max * (product.discount || 0)) / 100).toFixed(2)
                        };
                    }
                    const discountedPrice = (!hasVariant && (product.discount || 0) > 0) ? (product.price - (product.price * product.discount) / 100).toFixed(2) : null;

                    let shippingFlag = (
                        <div className="flex items-center gap-1">
                            <US className="w-4 h-auto" />
                            <CA className="w-4 h-auto" />
                        </div>
                    );
                    let currencyLabel = 'USD';
                    if (product.shippingDestination === 'canada_only') {
                        shippingFlag = (
                            <div className="flex items-center gap-1">
                                <CA className="w-4 h-auto" />
                            </div>
                        );
                        currencyLabel = 'CAD';
                    } else if (product.shippingDestination === 'us_only') {
                        shippingFlag = (
                            <div className="flex items-center gap-1">
                                <US className="w-4 h-auto" />
                            </div>
                        );
                        currencyLabel = 'USD';
                    }

                    return (
                        <li key={product._id || i} className="d-flex gap-3 mb-4">
                            <div className="post-thumb rounded overflow-hidden shadow-sm relative" style={{ width: '90px', height: '90px', flexShrink: 0 }}>
                                <Link href={`/shop/${product._id}`}>
                                    <Image
                                        src={ensureHttps(product.images?.[0] || "/images/default-product.jpg")}
                                        alt={product.name}
                                        width={90}
                                        height={90}
                                        className="object-cover w-100 h-100"
                                    />
                                    {product.productType !== 'affiliate' && (
                                        <span className="absolute bottom-1 left-1 bg-slate-800 text-white text-[10px] font-bold px-1 rounded shadow-md z-10 opacity-90 flex items-center justify-center">
                                            {shippingFlag}
                                        </span>
                                    )}
                                </Link>
                            </div>

                            <div className="post-content flex-1">
                                <Link href={`/shop/${product._id}`}>
                                    <h5 className="text-base font-semibold hover:underline text-gray-800 line-clamp-2" style={{ lineHeight: '1.2em' }}>
                                        {product.name}
                                    </h5>
                                </Link>
                                <div className="text-sm font-bold text-blue-600 mt-1">
                                    {hasVariant ? (
                                        (product.discount || 0) > 0 ? (
                                            <>
                                                ${variantRange.minDiscount} - ${variantRange.maxDiscount}
                                            </>
                                        ) : (
                                            variantRange.minBase === variantRange.maxBase ? `$${variantRange.minBase}` : `$${variantRange.minBase} - $${variantRange.maxBase}`
                                        )
                                    ) : (product.discount || 0) > 0 ? (
                                        <>
                                            ${discountedPrice} <del className="text-gray-400 text-xs">${product.price}</del>
                                        </>
                                    ) : (
                                        `$${product.price}`
                                    )}
                                    <span className="text-xs ml-1 text-gray-500 font-normal">{currencyLabel}</span>
                                </div>
                            </div>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

RelatedProducts.propTypes = {
    products: PropTypes.arrayOf(
        PropTypes.shape({
            _id: PropTypes.string,
            slug: PropTypes.string,
            name: PropTypes.string,
            price: PropTypes.number,
            currency: PropTypes.string,
            images: PropTypes.arrayOf(PropTypes.string),
        })
    ),
};

export default RelatedProducts;
