import React, { useEffect } from 'react'
import { useRouter } from 'next/router';
import { useState } from 'react';
import PropTypes from 'prop-types';

const ShopCategory = ({filterItem, menuItems, setProducts, selectedCategory, setSelectedCategory}) => {
    const [Data, setData] = useState([])

    const router = useRouter();
    const {id} = router.query;

    useEffect(() => {
        fetch("/data/products.json")
        .then(res => res.json())
        .then(data => setData(data))
        .catch(error => console.error("Error fetching products:", error));
    }, [])

  return (
    <div className='widget'>
        <div className='widget-header'>
            <h4>All Categories</h4>
        </div>
 
        <div className='widget-wrapper'>
            <button onClick={() => {setProducts(Data); setSelectedCategory("all")}} className={`m-2 ${selectedCategory === "all" ? "bg-warning" : ""}`}>All</button>
            {

                menuItems.map((Val, id) =>{
                    return(
                        <button className={`m-2 ${selectedCategory === Val ? "bg-warning" : ""}`} 
                        key = {id} 
                        onClick={() => filterItem(Val)}>
                            {Val}
                        </button>
                    )
                })
            }
        </div>
    </div>
  )
}

ShopCategory.propTypes = {
    filterItem: PropTypes.func.isRequired,
    menuItems: PropTypes.arrayOf(PropTypes.string).isRequired,
    setProducts: PropTypes.func.isRequired,
    selectedCategory: PropTypes.string.isRequired,
    setSelectedCategory: PropTypes.func.isRequired,
}

export default ShopCategory