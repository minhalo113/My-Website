import React, { useCallback, useEffect, useState } from 'react'
import PageHeader from './PageHeader'
import { useRouter } from 'next/router'
import Link from 'next/link'

import ProductCards from '../pages/shop/ProductCards';
import Paginations from '../pages/shop/Paginations';
import Search from '../pages/shop/Search';
import ShopCategory from '../pages/shop/ShopCategory';
import PopularPost from '../pages/shop/PopularPost';
import api from '../src/api/api';
import SEO from './SEO';
import PropTypes from 'prop-types';

const ShopWrapper = ({ productType = 'all' }) => {
    const router = useRouter();
    const [products, setProducts] = useState([]);
    const [categories, setAllCategories] = useState([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [isLoadingProducts, setIsLoadingProducts] = useState(true);
    const [productsError, setProductsError] = useState('');
    const [searchFacets, setSearchFacets] = useState(null);

    useEffect(() => {
        let ignore = false;
        const fetchCategories = async () => {
            try {
                const allCategories = await api.get('/customers-category-get', { withCredentials: true })
                if (!ignore) {
                    setAllCategories(allCategories.data.categorys || []);
                }
            } catch (err) {
                console.log(err)
            }
        };

        fetchCategories();
        return () => {
            ignore = true;
        };
    }, [])

    const [GridList, setGridList] = useState(true);

    const [allProducts, setAllProducts] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 30;
    const [searchValue, setSearchValue] = useState('');
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [minPrice, setMinPrice] = useState(null);
    const [maxPrice, setMaxPrice] = useState(null);

    useEffect(() => {
        if (!router.isReady) return;

        const rawCategory = Array.isArray(router.query?.category)
            ? router.query.category[0]
            : router.query?.category;

        if (rawCategory) {
            setSelectedCategory(rawCategory);
            setCurrentPage(1);
        }
    }, [router.isReady, router.query?.category]);

    useEffect(() => {
        let ignore = false;
        const fetchProducts = async () => {
            setIsLoadingProducts(true);
            setProductsError('');
            try {
                const params = {};
                if (productType && productType !== 'all') {

                    if (productType === 'standard') params.type = 'direct';
                    else if (productType === 'affiliate') params.type = 'global-finds';
                    else params.type = productType;
                }

                // Fetch products
                const { data } = await api.get('/customers-products-get', {
                    withCredentials: true,
                    params
                });

                if (ignore) return;

                const fetched = Array.isArray(data?.products) ? data.products : [];
                setAllProducts(fetched);
                setProducts(fetched);
                setTotalProducts(fetched.length);
            } catch (err) {
                if (ignore) return;
                console.log(err);
                setAllProducts([]);
                setProducts([]);
                setTotalProducts(0);
                setProductsError('Failed to load products. Please try again.');
            } finally {
                if (!ignore) {
                    setIsLoadingProducts(false);
                }
            }
        };

        fetchProducts();

        return () => {
            ignore = true;
        };
    }, [productType]);

    // Client-side filtering
    useEffect(() => {
        let filtered = allProducts;

        if (searchValue) {
            const lowerTerm = searchValue.toLowerCase();
            filtered = filtered.filter(p => p.name.toLowerCase().includes(lowerTerm));
        }

        if (selectedCategory && selectedCategory !== 'all') {
            filtered = filtered.filter(p => p.category === selectedCategory);
        }

        if (minPrice != null) {
            filtered = filtered.filter(p => p.price >= minPrice);
        }
        if (maxPrice != null) {
            filtered = filtered.filter(p => p.price <= maxPrice);
        }

        setProducts(filtered);
        setTotalProducts(filtered.length);
        setCurrentPage(1);
    }, [allProducts, searchValue, selectedCategory, minPrice, maxPrice]);

    // Client-side pagination
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

    const startResult = totalProducts === 0 ? 0 : indexOfFirstProduct + 1;
    const endResult = Math.min(indexOfLastProduct, totalProducts);

    const paginate = (pageNumber) => {
        setCurrentPage(pageNumber)
    }

    const menuItems = [...new Set(categories.map((category) => category.name))];

    const filterItem = useCallback((curcat) => {
        const normalizedCategory = curcat || 'all';
        setSelectedCategory(normalizedCategory);
        setCurrentPage(1);
        const query = normalizedCategory === 'all' ? {} : { category: normalizedCategory };

        const newQuery = { ...router.query, ...query };
        if (normalizedCategory === 'all') delete newQuery.category;

        router.push({ pathname: router.pathname, query: newQuery }, undefined, { shallow: true });
    }, [router]);

    const handleSearchTermChange = useCallback((value) => {
        setSearchValue(value);
        setCurrentPage(1);
    }, [])

    const handlePriceFilterChange = useCallback(({ min, max }) => {
        const normalizedMin = Number.isFinite(min) ? Number(min.toFixed(2)) : null;
        const normalizedMax = Number.isFinite(max) ? Number(max.toFixed(2)) : null;

        let didChange = false;

        setMinPrice((prev) => {
            if (prev === normalizedMin) return prev;
            didChange = true;
            return normalizedMin;
        });

        setMaxPrice((prev) => {
            if (prev === normalizedMax) return prev;
            didChange = true;
            return normalizedMax;
        });

        if (didChange) {
            setCurrentPage(1);
        }
    }, []);

    const pageTitleMap = {
        'all': 'Our Shop Page',
        'standard': 'Direct Store',
        'affiliate': 'Global Finds'
    };

    const title = pageTitleMap[productType] || 'Our Shop Page';

    return (
        <div>
            <SEO
                title={`${title} | A Figure A Day`}
                description="Browse curated anime figures and collectibles with daily deals at A Figure A Day."
                canonical={`https://www.afigureaday.com/shop${productType !== 'all' ? `/${productType}` : ''}`}
                keywords="shop anime figures, buy anime statues, collectible figures store"
            />
            <PageHeader title={title} curPage="Shop" />

            <div style={{ marginTop: "2rem", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>

                    <div
                        style={{
                            display: "inline-flex",
                            backgroundColor: "#f3f4f6",
                            padding: "4px",
                            borderRadius: "9999px",
                            boxShadow: "inset 0 0 4px rgba(0,0,0,0.05)"
                        }}
                    >

                        <Link
                            href="/shop"
                            style={{
                                padding: "8px 24px",
                                borderRadius: "9999px",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                textDecoration: "none",
                                transition: "all 0.3s",
                                backgroundColor: productType === "all" ? "#ffffff" : "transparent",
                                color: productType === "all" ? "#059669" : "#6b7280",
                                boxShadow: productType === "all" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                                cursor: "pointer"
                            }}
                        >
                            All Collection
                        </Link>

                        <Link
                            href="/shop/direct-store"
                            style={{
                                padding: "8px 24px",
                                borderRadius: "9999px",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                textDecoration: "none",
                                transition: "all 0.3s",
                                backgroundColor: productType === "standard" ? "#ffffff" : "transparent",
                                color: productType === "standard" ? "#059669" : "#6b7280",
                                boxShadow: productType === "standard" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                                cursor: "pointer"
                            }}
                        >
                            Direct Store 🇨🇦
                        </Link>

                        <Link
                            href="/shop/global-finds"
                            style={{
                                padding: "8px 24px",
                                borderRadius: "9999px",
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                textDecoration: "none",
                                transition: "all 0.3s",
                                backgroundColor: productType === "affiliate" ? "#ffffff" : "transparent",
                                color: productType === "affiliate" ? "#f97316" : "#6b7280",
                                boxShadow: productType === "affiliate" ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                                cursor: "pointer"
                            }}
                        >
                            Global Finds 🌍
                        </Link>

                    </div>

                    {productType === "standard" && (
                        <div style={{ marginTop: "1rem", textAlign: "center", maxWidth: "32rem" }}>
                            <p style={{
                                color: "#047857",
                                fontSize: "0.875rem",
                                backgroundColor: "#ecfdf5",
                                padding: "8px 16px",
                                borderRadius: "0.5rem",
                                border: "1px solid #d1fae5",
                                display: "inline-block"
                            }}>
                                ✨ Professional grade accessories sent directly from our warehouse partners.
                            </p>
                        </div>
                    )}

                    {productType === "affiliate" && (
                        <div style={{ marginTop: "1rem", textAlign: "center", maxWidth: "32rem" }}>
                            <p style={{
                                color: "#c2410c",
                                fontSize: "0.875rem",
                                backgroundColor: "#fff7ed",
                                padding: "8px 16px",
                                borderRadius: "0.5rem",
                                border: "1px solid #ffedd5",
                                display: "inline-block"
                            }}>
                                🌍 Products sourced from international marketplaces.
                            </p>
                        </div>
                    )}

                </div>
            </div>

            <div className='shop-page padding-tb'>
                <div className='container'>
                    <div className='row justify-content-center'>
                        <div className='col-lg-8 col-12'>
                            <article>
                                <div className='shop-title d-flex flex-warp justify-content-between'>
                                    <p>{`Showing ${String(startResult).padStart(2, '0')} - ${String(endResult).padStart(2, '0')} of ${totalProducts} Results`}</p>
                                    <div className={`product-view-mode ${GridList ? "gridActive" : "listActive"}`}>
                                        <a className='grid' onClick={() => setGridList(!GridList)}>
                                            <i className='icofont-ghost'></i>
                                        </a>

                                        <a className='list' onClick={() => setGridList(!GridList)}>
                                            <i className='icofont-listine-dots'></i>
                                        </a>
                                    </div>
                                </div>

                                {/* product cards */}
                                <div>
                                    {productsError && (
                                        <div className='alert alert-danger' role='alert'>
                                            {productsError}
                                        </div>
                                    )}
                                    {!productsError && isLoadingProducts && (
                                        <div className='py-4 text-center text-muted'>Loading products...</div>
                                    )}
                                    {!isLoadingProducts && !productsError && (
                                        <ProductCards GridList={GridList} products={currentProducts} />
                                    )}
                                </div>

                                <Paginations
                                    productsPerPage={productsPerPage}
                                    totalProducts={totalProducts}
                                    paginate={paginate}
                                    activePage={currentPage} />
                            </article>
                        </div>

                        <div className='col-lg-4 col-12'>
                            <aside>
                                <Search
                                    searchTerm={searchValue}
                                    onSearchTermChange={handleSearchTermChange}
                                    minPrice={minPrice}
                                    maxPrice={maxPrice}
                                    onPriceRangeChange={handlePriceFilterChange}
                                    selectedCategory={selectedCategory}
                                    onCategoryChange={filterItem}
                                    availableCategories={
                                        productType === 'affiliate'
                                            ? ['Aliexpress', 'eBay']
                                            : productType === 'standard'
                                                ? menuItems.filter(cat => !['Aliexpress', 'eBay'].includes(cat))
                                                : menuItems
                                    }
                                    categoryFacets={searchFacets?.categories}
                                    totalProducts={totalProducts}
                                    showCategoryFilter={true}
                                    showImageSearch={productType !== 'affiliate'}
                                />
                                {/* {console.log(menuItems === undefined)} */}
                                {productType !== 'affiliate' && (
                                    <ShopCategory
                                        filterItem={filterItem}
                                        menuItems={
                                            productType === 'affiliate'
                                                ? ['Aliexpress', 'eBay']
                                                : productType === 'standard'
                                                    ? menuItems.filter(cat => !['Aliexpress', 'eBay'].includes(cat))
                                                    : menuItems
                                        }
                                        selectedCategory={selectedCategory}
                                        categoryFacets={searchFacets?.categories}
                                        totalProducts={totalProducts}
                                    />
                                )}
                                <PopularPost />
                            </aside>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

ShopWrapper.propTypes = {
    productType: PropTypes.string,
};

export default ShopWrapper
