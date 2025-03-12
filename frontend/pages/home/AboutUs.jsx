import React from 'react'
import CountUp from 'react-countup';
import Link from 'next/link';

const subTitle = "Why Choose Us"; 
const title = "Explore Our Collection"; 
const desc = "Browse our vast collection of exciting toys on any device with ease. Discover the latest playtime innovations, fun accessories, and must-have toys at your fingertips. Just explore, shop, and bring joy to every adventure!"; 
const btnText = "Shop Now";

const countList = [ 
    { iconName: 'icofont-users-alt-4', count: '12600', text: 'Happy Customers', }, 
    { iconName: 'icofont-computer', count: '50', text: 'Products Available', }, 
    { iconName: 'icofont-gift', count: '100', text: 'Special Offers & Rewards', }, 
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
                                            <i className={val.iconName}></i>
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
                            <Link href = "/sign-up" className='lab-btn' style={{background: "#DCA54A"}}>{btnText}</Link>
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