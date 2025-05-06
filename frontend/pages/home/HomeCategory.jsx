import React from 'react'
import Banner from './Banner'
import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '../../src/api/api.js'

const subTitle = "Discover the Joy of Play!";
const title = "Find the Perfect Toy for Every Adventure";

const HomeCategory = () => {
    const [productData, setProductData] = useState([])
    
    useEffect(() =>{
        const fetchData = async() => {
            try{
                const allProducts = await api.get('/customers-products-get', {withCredentials: true})

                setProductData(allProducts.data.products);
            }catch(err){
                console.log(err)
            }
        };

        fetchData();
    }, [])

  return (
    <div className='category-section style-4 padding-tb'>
        <div className = "container">
            <div className='section-header text-center'>
                <span className='subtitle'>{subTitle}</span>
                <h2 className='title'>{title}</h2>
            </div>
            {/* section card */}
            <div className='section-wrapper' style={{display:"flex", justifyContent: 'center'}}>
                <div className='row g-4 justify-content-center row-cols-md-3 row-cols-sm-2 row-cols-1'>
                    {
                        productData.slice(0, 6).map((val, i) => (
                        <div key={i} className='col' style={{display:"flex", justifyContent: 'center'}}>
                            <Link href = "/shop" className='category-item'>
                                <div className='category-inner'>
                                    <div className='category-thumb'>
                                        <img src = {Array.isArray(val.images) ? val.images[0] : val.images}></img>
                                    </div>

                                    <div className='category-content'>
                                        <span>{val.category}</span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                        )
                        )
                    }
                </div>
            </div>
        </div>

    </div>
  )
}

export default HomeCategory