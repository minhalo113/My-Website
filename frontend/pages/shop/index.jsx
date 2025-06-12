import React, { useEffect } from 'react'
import PageHeader from '../../components/PageHeader'
import { useState } from 'react';

import ProductCards from './ProductCards';
import Paginations from './Paginations';
import Search from './Search';
import ShopCategory from './ShopCategory';
import PopularPost from './PopularPost';
import Tags from './Tags';
import api from '../../src/api/api';

const showResults = "Showing 01 - 12 of 139 Results"

const Shop = () => {
  // const [Data, setData] = useState([]);
  const [products, setproducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [categories, setAllCategories] = useState([]);
  // useEffect(() => {
  //     fetch("/data/products.json")
  //     .then(res => res.json())
  //     .then(data => {setData(data); setproducts(data)})
  //     .catch(error => console.error("Error fetching prodcuts:", error))
    
  // }, [])

  useEffect(() =>{
    const fetchData = async() => {
        try{
            const allProducts = await api.get('/customers-products-get', {withCredentials: true})
            const allCategories = await api.get('/customers-category-get', {withCredentials: true})

            setproducts(allProducts.data.products);
            setTotalProducts(allProducts.data.totalProduct);
            setAllProducts(allProducts.data.products);
            setAllCategories(allCategories.data.categorys);
        }catch(err){
            console.log(err)
        }finally{
            // setLoading(false);
        }
    };

    fetchData();
}, [])

  const [GridList, setGridList] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 12;

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = products.slice(indexOfFirstProduct, indexOfLastProduct);

  const paginate = (pageNumber) =>{
    setCurrentPage(pageNumber)
  }

  const [selectedCategory, setSelectedCategory] = useState("all")
  const menuItems = [...new Set(categories.map((category) => category.name))];

  const filterItem = (curcat) => {
    if (curcat === 'all'){
      setproducts(allProducts);
    }else{
      const newItem = allProducts.filter((newVal) =>{
        return newVal.category === curcat;
      })
      setproducts(newItem);
    }
  
    setSelectedCategory(curcat);
  }

  return (
    <div>
        <PageHeader title = "Our Shop Page" curPage = "Shop"/>

        <div className='shop-page padding-tb'>
          <div className='container'>
            <div className='row justify-content-center'>
              <div className='col-lg-8 col-12'>
                <article>
                  <div className='shop-title d-flex flex-warp justify-content-between'>
                    <p>{`Showing 01 - 12 of ${totalProducts} Results`}</p>
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
                    <ProductCards GridList= {GridList} products = {currentProducts}/>
                  </div>

                  <Paginations
                  productsPerPage = {productsPerPage}
                  totalProducts = {products.length}
                  paginate = {paginate}
                  activePage = {currentPage}/>
                  </article>
              </div>

              <div className='col-lg-4 col-12'>
                <aside>
                  <Search products={products}/>
                  {/* {console.log(menuItems === undefined)} */}
                  <ShopCategory filterItem ={filterItem} menuItems={menuItems} setProducts = {setproducts}
                  selectedCategory = {selectedCategory} setSelectedCategory = {setSelectedCategory}/>
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