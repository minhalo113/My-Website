
<link rel="stylesheet" href="myProjects/webProject/icofont/css/icofont.min.css"></link>

const title = "About The Toy Haven"; 
const desc = "Welcome to Toy Haven, your ultimate destination for fun, creativity, and adventure! Explore a world of exciting toys designed to spark imagination and endless joy.";
const ItemTitle = "Categories"; 
const quickTitle = "Quick Links"; 
// const blogTitle = "Recent Blogs";

const addressList = [ { iconName: 'icofont-google-map', text: ' Edmonton, Canada.', }, 
    { iconName: 'icofont-phone', text: ' +780 655 6756', }, 
    { iconName: 'icofont-envelope', text: ' ahistoryfactaday@gmail.com', }, ]

const socialList = [ 
    { iconName: 'icofont-facebook', siteLink: 'https://www.facebook.com/profile.php?id=61569962775709', className: 'facebook', }, 
    { iconName: 'icofont-x', siteLink: 'https://x.com/fact_a8206', className: 'twitter', }, 
    { iconName: 'icofont-tiktok', siteLink: 'https://www.tiktok.com/@ahistoryfactaday', className: 'tiktok', },
    { iconName: 'icofont-instagram', siteLink: 'https://www.instagram.com/ahistoryfactaday/?hl=en', className: 'instagram', }, 
    { iconName: 'icofont-youtube', siteLink: 'https://www.youtube.com/@RandoHistoryFacts_', className: 'youtube', }, ]

const ItemList = [ { text: 'All Products', link: '/shop', }, 
    { text: 'Shop', link: '/shop', }, { text: 'Blog', link: '/blog', }, 
    { text: 'About', link: '/about', }, { text: 'Refund Policy', link: '/refund-policy', }, 
    { text: 'Shipping Policy', link: '/shipping-policy',},
    {/*{ text: 'FAQs', link: '/about', }*/} ]

const quickList = [ /*{ text: 'Summer Sessions', link: '#', },*/
    //  { text: 'Events', link: '#', }, { text: 'Gallery', link: '#', }, 
    // { text: 'Forums', link: '#', },
     { text: 'Privacy Policy', link: '/privacy-policy', }, 
     { text: 'Terms of Service', link: '/terms-of-service', }, ]

const Footer = () => {
  return (
    <footer className='style-2'>
        <div className = 'footer-top dark-view padding-tb'>
            <div className='container'>
                <div className='row g-4 row-cols-xl-4 row-cols-sm-2 row-cols-1 justify-content-center'>

                    <div className='col justify-content-center'>
                        <div className='footer-item our-address'>
                            <div className='footer-inner'>
                                <div className='footer-content'>
                                    <div className='title'>
                                        <h4>{quickTitle}</h4>
                                    </div>
                                    <div className="content">
                                        <ul className='lab-ul office-address'>
                                        {
                                            quickList.map((val, i) => (
                                                <li key={i}><a href= {val.link}>{val.text}</a></li>
                                            ))
                                        }
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='col justify-content-center'>
                        <div className='footer-item our-address'>
                            <div className='footer-inner'>
                                <div className='footer-content'>
                                    <div className='title'>
                                        <h4>{title}</h4>
                                    </div>
                                    <div className="content">
                                        <p>{desc}</p>
                                        <ul className='lab-ul office-address'>
                                        {
                                            addressList.map((val, i) => (
                                                <li key = {i}><i className={val.iconName}>{val.text}</i></li>
                                            ))
                                        }
                                        </ul>
                                        
                                        <ul className='lab-ul social-icons justify-content-center'>
                                        {
                                            socialList.map((val, i) => (
                                                <li key = {i}>
                                                    <a href={val.siteLink} className={val.className} target="_blank" rel="noopener noreferrer">
                                                        <i className={val.iconName}>{val.text}</i>
                                                    </a>
                                                </li>
                                                ))
                                        }
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className='col'>
                        <div className='footer-item our-address'>
                            <div className='footer-inner'>
                                <div className='footer-content'>
                                    <div className='title'>
                                        <h4>{ItemTitle}</h4>
                                    </div>
                                    <div className="content">
                                        <ul className='lab-ul office-address'>
                                        {
                                            ItemList.map((val, i) => (
                                                <li key={i}><a href= {val.link}>{val.text}</a></li>
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
        </div>

        {/* <div className='footer-bottom'>
            <div className="container">
                <div className="section-wrapper">
                    <p>&copy; 2024 <Link to = "/">Shop Cart</Link> Designed by <a href='/' target = "_blank">Michael Luong</a></p>
                    <div className='footer-bottom-list'>
                        {
                            footerbottomList.map((val, i) => (
                                <a href='#' key={i}>
                                    {val.text}
                                </a>
                            ))
                        }
                    </div>
                </div>
            </div>
        </div> */}
    </footer>
  )
}

export default Footer