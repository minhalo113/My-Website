import React, { useState, useEffect, useCallback } from 'react'
import api from '../../src/api/api.js'
import Rating from '../../components/Rating'
import Link from 'next/link'
import DiscountBadge from '../../components/DiscountBadge'
import Image from 'next/image';
import PropTypes from 'prop-types';
import { ensureHttps } from '../../src/utils/imageUtils';

const title = "Our Products"
const btnText = "Start Shopping Now";

const CategoryShowCase = () => {
    const [productData, setProductData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);

    const [allCategories, setAllCategories] = useState([])
    const [activeCategory, setActiveCategory] = useState("All Categories");

    const fetchProducts = useCallback(async (categoryName = 'All Categories') => {
        setLoading(true);
        try {
            const response = await api.get('/customers-products-get', {
                params: {
                    sort: 'reviews',
                    parPage: 12,
                    category: categoryName && categoryName !== 'All Categories' ? categoryName : undefined,
                },
                withCredentials: true
            });
            const products = response?.data?.products || [];

            setProductData(products);
            setItems(products);
            setActiveCategory(categoryName || 'All Categories');
        } catch (err) {
            console.log(err)
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const allCategories = await api.get('/customers-category-get', { withCredentials: true })
                setAllCategories(allCategories.data.categorys || []);
            } catch (err) {
                console.log(err)
            }
        };

        fetchCategories();
        fetchProducts('All Categories');
    }, [fetchProducts])

    const formatCurrency = (value) => {
        const numericValue = typeof value === 'number' ? value : parseFloat(value);
        if (!Number.isFinite(numericValue)) {
            return value;
        }
        return `$${numericValue.toFixed(2)}`;
    };

    const renderDiscountedPrice = (discountedLabel, originalLabel) => (
        <>
            <span className="text-[11px] uppercase tracking-wide text-red-500 font-semibold">Sale</span>
            <span className="flex items-baseline gap-2">
                <span className="font-semibold text-lg text-[#DCA54A]">{discountedLabel}</span>
                <del className="text-xs text-gray-500">{originalLabel}</del>
            </span>
        </>
    );

    const renderPrice = (product) => {
        const hasVariant =
            product.colors &&
            product.colors.length > 0 &&
            Array.isArray(product.colorPrices) &&
            product.colorPrices.length > 0;

        if (hasVariant) {
            const prices = product.colors
                .map((c, idx) => product.colorPrices[idx])
                .filter((v) => v !== undefined);

            if (!prices.length) {
                return <span className="font-semibold text-lg text-[#DCA54A]">{formatCurrency(product.price)}</span>;
            }

            const min = Math.min(...prices);
            const max = Math.max(...prices);
            const hasRange = min !== max;
            const baseLabel = hasRange
                ? `${formatCurrency(min)} - ${formatCurrency(max)}`
                : formatCurrency(min);

            if (product.discount > 0) {
                const discountMultiplier = 1 - product.discount / 100;
                const minDiscount = min * discountMultiplier;
                const maxDiscount = max * discountMultiplier;
                const discountedLabel = hasRange
                    ? `${formatCurrency(minDiscount)} - ${formatCurrency(maxDiscount)}`
                    : formatCurrency(minDiscount);

                return renderDiscountedPrice(discountedLabel, baseLabel);
            }

            return <span className="font-semibold text-lg text-[#DCA54A]">{baseLabel}</span>;
        }

        if (product.discount > 0) {
            const discountedPrice =
                product.price - (product.price * product.discount) / 100;
            return renderDiscountedPrice(formatCurrency(discountedPrice), formatCurrency(product.price));
        }

        return <span className="font-semibold text-lg text-[#DCA54A]">{formatCurrency(product.price)}</span>;
    };

    const filterItem = async (categItem) => {
        await fetchProducts(categItem);
    }

    if (loading) return <p>Loading product details...</p>
    return (
        <div className='course-section style-3 padding-tb'>
            <div>
                {/*shape*/}
                <Image className='course-shape one combined-effect' src="/images/shape-img/icon/circle-background.png" width={100} height={100} alt="" style={{ width: '100px', height: 'auto' }} />
                <Image className='course-shape two drip-glow-effect' src="/images/shape-img/icon/circle-background-2.png" width={100} height={100} alt="" style={{ width: '100px', height: 'auto' }} />
            </div>

            {/*main section*/}
            <div className='container' >
                {/* section header */}
                <div className='section-header flex flex-col items-center gap-4' style={{ justifyContent: 'center' }}>
                    <h2 className='title'>
                        {title}
                    </h2>
                    <div className='course-filter-group'>
                        <ul className='lab-ul' style={{ justifyContent: 'center' }}>
                            <li onClick={() => fetchProducts('All Categories')} style={{ background: activeCategory === "All Categories" ? "#DCA54A" : "" }}>All Categories</li>
                            {
                                allCategories.map((category, index) =>
                                    <li key={index} onClick={() => { filterItem(category.name) }} style={{ background: activeCategory === category.name ? "#DCA54A" : "" }}>{category.name}</li>
                                )
                            }
                        </ul>
                    </div>
                </div>

                {/* section body */}
                <div className="section-wrapper">
                    {loading ? <p>Loading product details...</p> : (
                        <div className='row g-4 justify-content-center row-cols-x1-4 row-cols-lg-3 row-cols-md-2 row-cols-1
                 course-filter' >
                            {items.slice(0, 12).map((product) =>
                                <div key={product._id.toString()} className='col'>
                                    <div className='course-item style-4'>
                                        <div className='course-inner'>
                                            <div className='course-thumb relative' style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}>
                                                <Image
                                                    src={ensureHttps(Array.isArray(product.images) ? product.images[0] : product.images)}
                                                    alt={product.name}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    style={{ objectFit: 'contain' }}
                                                />
                                                <DiscountBadge discount={product.discount} />
                                                <div className='course-category'>
                                                    <div className='course-cate'><a href={`/shop/${product._id.toString()}`}>{product.category}</a></div>
                                                </div>
                                            </div>

                                            <div className='course-content'>
                                                <Link href={`/shop/${product._id.toString()}`}><h6>{product.name}</h6></Link>
                                                <div className='mt-2'>
                                                    <Rating
                                                        rating={product.averageRating}
                                                        number_of_ratings={product.reviewCount}
                                                        layout="stacked"
                                                    />
                                                </div>
                                                <div className='course-footer'>
                                                    <div className='course-author'>
                                                        <Link href={`/shop/${product._id.toString()}`} className='ca-name'>{product.seller}</Link>
                                                    </div>
                                                    <div className='course-price flex flex-col items-end text-right gap-1' style={{ color: "#DCA54A" }}>
                                                        {renderPrice(product)}
                                                    </div>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </div>)}

                        </div>
                    )}
                    <div className='text-center mt-5'>
                        <Link href="/shop" className='lab-btn' style={{ background: "#DCA54A" }}><span style={{ color: '#101115' }}>{btnText}</span></Link>
                    </div>
                </div>
            </div>
        </div>
    )
}

CategoryShowCase.propTypes = {
    initialProducts: PropTypes.array,
    allCategories: PropTypes.array,
};

export default CategoryShowCase
