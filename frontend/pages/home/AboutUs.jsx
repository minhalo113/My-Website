import React from 'react'
import CountUp from 'react-countup';
import Link from 'next/link';

const subTitle = "Why Choose Us"; 
const title = "Explore Our Collection"; 
const desc = "Browse our growing collection of anime statues, scale figures, and desk companions with ease. Discover limited drops, everyday essentials, and display-ready pieces curated for collectors."; 
const btnText = "Shop Now";

const countList = [
  { icon: "👥", count: "12600", text: "Happy Customers" },
  { icon: "🎎", count: "300", text: "Figures Available" },
  { icon: "🏷️", count: "100", text: "Special Coupons" },
];

const AboutUs = () => {
  return (
    <div className='instructor-section style-2 padding-tb section-bg-ash'>
        <div className='container'>
            <div className='section-wrapper'>
                <div className='row g-4 justify-content-center align-item-center row-cols-1 row-cols-md-2 row-cols-xl-3'>
                    <div className='col'>
                        {
                            countList.map((val, i) => (
                                <div key = {i} className='count-item'>
                                    <div className='count-inner'>
                                        <div className='count-icon'>
                                            <i className="flex items-center justify-center text-4xl w-16 h-16 rounded-full">
                                                {val.icon}
                                            </i>
                                        </div>

                                        <div className='count-content'>
                                            <h2>
                                                <span><CountUp end = {val.count}/>+</span>
                                                <span></span>
                                            </h2>
                                            <p>{val.text}</p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        }
                    </div>

                    <div className='col'>
                        <div className='instructor-content'>
                            <span className='subtitle'>{subTitle}</span>
                            <h2 className='title'>{title}</h2>
                            <p>{desc}</p>
                            <Link href = "/shop" className='lab-btn' style={{background: "#ffffff"}}>{btnText}</Link>
                        </div>
                    </div>

                    <div className='col'>
                        <div className='instructor-thumb'>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </div>
  )
}

export default AboutUs