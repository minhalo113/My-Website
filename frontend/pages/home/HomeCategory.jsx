import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '../../src/api/api.js'

const subTitle = "Celebrate Your Fandom";
const title = "Find the Perfect Figure for Every Collection";

const HomeCategory = () => {
    const [categories, setCategories] = useState([])
    
    useEffect(() =>{
        const fetchData = async() => {
            try{
                const response = await api.get('/customers-category-get', {withCredentials: true})
                setCategories(response?.data?.categorys || []);
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
                        categories.slice(0, 6).map((val) => (
                        <div key={val._id || val.slug || val.name} className='col' style={{display:"flex", justifyContent: 'center'}}>
                            <Link href = "/shop" className='category-item'>
                                <div className='category-inner'>
                                    <div className='category-thumb'>
                                        <img src = {val.image}></img>
                                    </div>

                                    <div className='category-content'>
                                        <span>{val.name}</span>
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
