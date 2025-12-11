import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ensureHttps } from '../../src/utils/imageUtils';

const RelatedProducts = ({ products }) => {
    if (!products || products.length === 0) return null;

    return (
        <div className='widget widget-post'>
            <div className='widget-header'>
                <h5 className='title'>Related Products</h5>
            </div>

            <ul className='widget-wrapper'>
                {products.map((product, i) => (
                    <li key={product._id || i} className="d-flex gap-3 mb-4">
                        <div className="post-thumb rounded overflow-hidden shadow-sm" style={{ width: '90px', height: '90px', flexShrink: 0 }}>
                            <Link href={`/shop/${product.slug}`}>
                                <Image
                                    src={ensureHttps(product.images?.[0] || "/images/default-product.jpg")}
                                    alt={product.name}
                                    width={90}
                                    height={90}
                                    className="object-cover w-100 h-100"
                                />
                            </Link>
                        </div>

                        <div className="post-content flex-1">
                            <Link href={`/shop/${product.slug}`}>
                                <h5 className="text-base font-semibold hover:underline text-gray-800 line-clamp-2" style={{ lineHeight: '1.2em' }}>
                                    {product.name}
                                </h5>
                            </Link>
                            <p className="text-sm font-bold text-blue-600 mt-1">
                                {product.currency || '$'} {product.price}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default RelatedProducts;
