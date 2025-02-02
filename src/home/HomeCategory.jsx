import React from 'react'
import Banner from './Banner'
import productData from "../products.json"
import { Link } from 'react-router-dom';

const subTitle = "Choose Any Books";
const title = "Buy Any Book With Us";
const btnText = "Get Started Now";

const HomeCategory = () => {
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
                            <Link to = "/shop" className='category-item'>
                                <div className='category-inner'>
                                    <div className='category-thumb'>
                                        <img src={val.img} style={{width: "200px", height: "auto"}}></img>
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
        <div className='text-center mt-5'>
            <Link to = "/shop" className='lab-btn' style={{background:"#DCA54A"}}><span style={{color: '#101115'}}>{btnText}</span></Link>
        </div>
    </div>
  )
}

export default HomeCategory