import React, { useCallback, useEffect, useState } from 'react'
import PageHeader from '../../components/PageHeader'

import ProductCards from './ProductCards';
import Paginations from './Paginations';
import Search from './Search';
import ShopCategory from './ShopCategory';
import PopularPost from './PopularPost';
import api from '../../src/api/api';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [categories, setAllCategories] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState('');
  const [searchFacets, setSearchFacets] = useState(null);

  useEffect(() =>{
    let ignore = false;
    const fetchCategories = async() => {
        try{
            const allCategories = await api.get('/customers-category-get', {withCredentials: true})
            if (!ignore) {
              setAllCategories(allCategories.data.categorys || []);
            }
        }catch(err){
            console.log(err)
        }
    };

    fetchCategories();
    return () => {
      ignore = true;
    };
}, [])

  const [GridList, setGridList] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 36;
  const [searchValue, setSearchValue] = useState('');
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [minPrice, setMinPrice] = useState(null);
  const [maxPrice, setMaxPrice] = useState(null);

  useEffect(() => {
    let ignore = false;
        const fetchProducts = async () => {
      setIsLoadingProducts(true);
      setProductsError('');
      try {
        const params = {
          page: currentPage,
          parPage: productsPerPage,
        };

        if (searchValue) {
          params.searchValue = searchValue;
        }

        if (selectedCategory && selectedCategory !== 'all') {
          params.category = selectedCategory;
        }

        if (minPrice != null) {
          params.minPrice = minPrice;
        }

        if (maxPrice != null) {
          params.maxPrice = maxPrice;
        }

        const { data } = await api.get('/customers-products-get', {
          params,
          withCredentials: true,
        });

        if (ignore) return;

        setProducts(Array.isArray(data?.products) ? data.products : []);
        const totalCount = Number(data?.totalProduct);
        setTotalProducts(Number.isFinite(totalCount) ? totalCount : 0);
        setSearchFacets(data?.facets || null);
      } catch (err) {
        if (ignore) return;
        console.log(err);
        setProducts([]);
        setTotalProducts(0);
        setProductsError('Failed to load products. Please try again.');
        setSearchFacets(null);
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
  }, [currentPage, productsPerPage, searchValue, selectedCategory, minPrice, maxPrice]);

  const currentProducts = products;

  const startResult = totalProducts === 0 ? 0 : (currentPage - 1) * productsPerPage + 1;
  const endResult = Math.min(currentPage * productsPerPage, totalProducts);

  const paginate = (pageNumber) =>{
    setCurrentPage(pageNumber)
  }

  const menuItems = [...new Set(categories.map((category) => category.name))];

  const filterItem = (curcat) => {
    setSelectedCategory(curcat);
    setCurrentPage(1);
  }

  const handleSearchTermChange = useCallback((value) => {
    setSearchValue(value);
    setCurrentPage(1);
    setSelectedCategory('all');
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

  return (
    <div>
        <PageHeader title = "Our Shop Page" curPage = "Shop"/>

        <div className='shop-page padding-tb'>
          <div className='container'>
            <div className='row justify-content-center'>
              <div className='col-lg-8 col-12'>
                <article>
                  <div className='shop-title d-flex flex-warp justify-content-between'>
                    <p>{`Showing ${String(startResult).padStart(2, '0')} - ${String(endResult).padStart(2, '0')} of ${totalProducts} Results`}</p>
                    <div className={`product-view-mode ${GridList ? "gridActive" : "listActive"}`}>
                      <a className='grid' onClick = {() => setGridList(!GridList)}>
                        <i className='icofont-ghost'></i>
                      </a>

                      <a className='list' onClick = {() => setGridList(!GridList)}>
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
                      <ProductCards GridList= {GridList} products = {currentProducts}/>
                    )}
                  </div>

                  <Paginations
                  productsPerPage = {productsPerPage}
                  totalProducts = {totalProducts}
                  paginate = {paginate}
                  activePage = {currentPage}/>
                  </article>
              </div>

              <div className='col-lg-4 col-12'>
                <aside>
                  <Search
                    searchTerm={searchValue}
                    onSearchTermChange={handleSearchTermChange}
                    minPrice = {minPrice}
                    maxPrice = {maxPrice}
                    onPriceRangeChange= {handlePriceFilterChange}
                  />
                  {/* {console.log(menuItems === undefined)} */}
                  <ShopCategory                     
                    filterItem ={filterItem}
                    menuItems={menuItems}
                    selectedCategory = {selectedCategory}
                    categoryFacets={searchFacets?.categories}
                    totalProducts={totalProducts}
                  />
                  <PopularPost/>
                </aside>
              </div>
            </div>
          </div>
        </div>

    </div>
  )
}

export default Shop