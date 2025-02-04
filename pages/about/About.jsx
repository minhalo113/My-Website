import React from 'react'
import PageHeader from '../components/PageHeader';

const subTitle = "About Our Store"; 
const title = "Endless Fun and Adventure for All Ages";  
const desc = "Explore a world of joy at Toy Haven! From classic favorites to the latest must-have toys, we bring excitement, creativity, and endless fun for kids and collectors alike.";  

const year = "3+";
const expareance = "Years Of Experiences";

const aboutList = [ { imgUrl: '/src/assets/images/about/icon/01.jpg', 
    title: "Expertly Crafted Toys",
    desc: "Designed with quality and creativity, our toys bring joy, learning, and adventure to every playtime."}, 
    { imgUrl: '/src/assets/images/about/icon/02.jpg',
        title:"Safe & Certified",
        desc: "We ensure all our toys meet the highest safety standards, giving parents peace of mind and kids endless fun." }, 
        { imgUrl: '/src/assets/images/about/icon/03.jpg', imgAlt: 'about icon rajibraj91 rajibraj', 
            title: "Exciting Collections",
        desc: "From educational toys to action figures, discover a world of fun with our diverse range of toys for all ages." }, ]

const About = () => {
  return (
    <div>
        <PageHeader title = {subTitle} curPage={"About"}/>

        <div className='about-section style-3 padding-tb section-bg'>
            <div className='container'>
                <div className='row justify-content-center row-cols-xl-2 row-cols-1 align-items-center'>
                    <div className='col'>
                        <div className='about-left'>
                            <div className="about-thumb">
                                <img src = "/src/assets/images/about/01.jpg" alt = ""/>
                            </div>

                            <div className='abs-thumb'>
                                <img src = "/src/assets/images/about/02.jpg" alt = ""/>
                            </div>

                            <div className='about-left-content'>
                                <h3>{year}</h3>
                                <p>{expareance}</p>
                            </div>
                        </div>
                    </div>

                    <div className='col'>
                        <div className="about-right">
                            <div className="section-header">
                                <span className='subtitle'>{subTitle}</span>
                                <h2 className='title'>{title}</h2>
                                <p>{desc}</p>
                            </div>

                            <div className='section-wrapper'>
                                <ul className='lab-ul'>
                                    {
                                        aboutList.map((val, i) => (
                                            <li key = {i}>
                                                <div className='sr-left'>
                                                    <img src = {val.imgUrl} alt = ""/>
                                                </div>

                                                <div className='sr-right'>
                                                    <h5>{val.title}</h5>
                                                    <p>{val.desc}</p>
                                                </div>
                                            </li>
                                        ))
                                    }
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default About