import React, { useState, useContext } from 'react'
import { Link, NavLink } from 'react-router-dom';
import '../App.css'
import logo from "../assets/images/logo/myLogo.webp"

import { AuthContext } from '../contexts/AuthProvider';

const NavItems = () => {
  const [menuToggle, setMenuToggle] = useState(false);
  const [socialToggle, setSocialToggle] = useState(false);
  const [headerFixed, setHeaderFixed] = useState(false);

  // authInfo
  const {user, logOut} = useContext(AuthContext);

  // add event listener

  window.addEventListener("scroll", ()=>{
    if(window.scrollY > 200){
      setHeaderFixed(true);
    }else{
      setHeaderFixed(false);
    }
  })


  return (
    <header className={`header-section style-4 ${headerFixed ? "header-fixed fadeInUp" : ""}`}>
      {/* header top start */}
      <div className={`header-top d-md-none ${socialToggle ? "open" : ""}`} >
          <div>
            <div className='container'>
              <div className='header-top-area'>
                <Link to = "/signup" className='custom-lab-btn lab-btn me-3'>
                  <span>Create Account</span>
                </Link>

                <Link to = "/login">
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </div>
        
      {/* header botton */}
      <div className='header-bottom'>
        <div className='container'>
          <div className='header-wrapper'>
            {/*logo */}
            <div className='logo-search-acte'>
              <div className='logo'>
                <Link to = {"/"}>
                  <img src = {logo} alt = ""   style={{width: "120px", height: "120px"}}/>
                </Link>
              </div>

            </div>
              {/* menu area */}
              <div className='menu-area'>
                <div className='menu'>
                  <ul className={`lab-ul ${menuToggle ? "active": ""}`}>
                    <li><Link to = "/">Home</Link></li>
                    <li><Link to = "/shop">Shop</Link></li>
                    <li><Link to = "/blog">Blog</Link></li>
                    <li><Link to = "/about">About</Link></li>
                    <li><Link to = "/contact">Contact</Link></li>
                    <li><Link to = "/cart-page">Shopping Cart</Link></li>
                  </ul>
                </div>

                {
                  console.log(user)
                }
                {/* sign in and log in */}
                { user ? 
                (<><Link to = "/" className='d-none d-md-block' onClick={logOut}>Log Out</Link></>

                ): 
                (<>
                    <Link to = "/sign-up" className='custom-lab-btn lab-btn me-3 d-none d-md-block'>Create Account</Link>
                    <Link to = "/login" className='d-none d-md-block'>Log In</Link>
                  </>)
                }
                {
                  console.log(user)
                }
                {/* menu toggler */}
                <div onClick={() => setMenuToggle(!menuToggle)} className={`header-bar d-lg-none ${menuToggle ? "active" : ""}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                {/* social toggler*/}
                <div className='ellepsis-bar d-md-none'
                  onClick={() => setSocialToggle(!socialToggle)}
                >
                  <i className = "icofont-info-square"></i>
                </div>
              </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default NavItems