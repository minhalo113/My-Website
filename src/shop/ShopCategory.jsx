import React from 'react'
import '../App.css'
import Data from "../products.json"

const ShopCategory = ({filterItem, menuItems, setProducts, selectedCategory, setSelectedCategory}) => {

  return (
    <>
        <div className='widget-header'>
            <h5 className='ms-2'>All Categories</h5>
        </div>
 
        <div>
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
    </>
  )
}

export default ShopCategory