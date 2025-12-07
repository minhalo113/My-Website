import React, { useCallback, useEffect, useState } from 'react'
import PageHeader from './PageHeader'
import { useRouter } from 'next/router'

import ProductCards from '../pages/shop/ProductCards';
import Paginations from '../pages/shop/Paginations';
import Search from '../pages/shop/Search';
import ShopCategory from '../pages/shop/ShopCategory';
import PopularPost from '../pages/shop/PopularPost';
import api from '../src/api/api';
import SEO from './SEO';

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
                    params.type = productType;
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
        // Preserve other query params like type if needed, but here we are using URL query for shop root not state
        // Actually, if we are in /shop/affiliate, the route is different.
        // If we are in /shop?type=affiliate, we need to preserve it.
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
        'dropship': 'Dropship Store',
        'affiliate': 'Affiliate Store'
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

            {/* Navigation Tabs */}
            <div className="container mt-4">
                <ul className="nav nav-tabs">
                    <li className="nav-item">
                        <a className={`nav-link ${productType === 'all' ? 'active' : ''}`} href="/shop" onClick={(e) => { e.preventDefault(); router.push('/shop'); }}>
                            All
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className={`nav-link ${productType === 'dropship' ? 'active' : ''}`} href="/shop/dropship" onClick={(e) => { e.preventDefault(); router.push('/shop/dropship'); }}>
                            Dropship
                        </a>
                    </li>
                    <li className="nav-item">
                        <a className={`nav-link ${productType === 'affiliate' ? 'active' : ''}`} href="/shop/affiliate" onClick={(e) => { e.preventDefault(); router.push('/shop/affiliate'); }}>
                            Affiliate
                        </a>
                    </li>
                </ul>
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
                                    availableCategories={menuItems}
                                    categoryFacets={searchFacets?.categories}
                                    totalProducts={totalProducts}
                                />
                                {/* {console.log(menuItems === undefined)} */}
                                <ShopCategory
                                    filterItem={filterItem}
                                    menuItems={menuItems}
                                    selectedCategory={selectedCategory}
                                    categoryFacets={searchFacets?.categories}
                                    totalProducts={totalProducts}
                                />
                                <PopularPost />
                            </aside>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default ShopWrapper
