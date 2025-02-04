import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import Image from "next/image";


// import { AuthContext } from '../contexts/AuthProvider';

const NavItems = () => {
  const [menuToggle, setMenuToggle] = useState(false);
  const [socialToggle, setSocialToggle] = useState(false);
  const [headerFixed, setHeaderFixed] = useState(false);

  // authInfo
  // const {user, logOut} = useContext("AuthContext");

  // add event listener
  useEffect(() => {
    const handleScroll = () => {
      setHeaderFixed(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []); 

  return (
    <header  className={`header-section style-4 ${headerFixed ? "header-fixed fadeInUp" : ""}`}>
      {/* header top start */}
      <div className={`header-top d-md-none ${socialToggle ? "open" : ""}`} >
          <div>
            <div className='container'>
              <div className='header-top-area'>
                <Link href = "/signup" className='custom-lab-btn lab-btn me-3'>
                  <span>Create Account</span>
                </Link>

                <Link href = "/login">
                  Log in
                </Link>
              </div>
            </div>
          </div>
        </div>
        
      {/* header botton */}
      <div className='header-bottom'>
        <div className='container' >
          <div className='header-wrapper'>
            {/*logo */}
            <div className='logo-search-acte'>
              <div className='logo'>
                <Link href = {"/"}>
                  <img src = "/images/logo/myLogo.webp" alt = ""   style={{width: "120px", height: "120px"}}/>
                </Link>
              </div>

            </div>
              {/* menu area */}
              <div className='menu-area'>
                <div className='menu'>
                  <ul className={`lab-ul ${menuToggle ? "active": ""}`}>
                    <li><Link href = "/">Home</Link></li>
                    <li><Link href = "/shop">Shop</Link></li>
                    <li><Link href = "/blog">Blog</Link></li>
                    <li><Link href = "/about">About</Link></li>
                    <li><Link href = "/contact">Contact</Link></li>
                    <li><Link href = "/cart-page">Shopping Cart</Link></li>
                  </ul>
                </div>

                {/* {
                  console.log(user)
                } */}
                {/* sign in and log in */}
                {/* { user ? 
                (<><Link to = "/" className='d-none d-md-block' onClick={logOut}>Log Out</Link></>

                ): 
                (<>
                    <Link to = "/sign-up" className='custom-lab-btn lab-btn me-3 d-none d-md-block'>Create Account</Link>
                    <Link to = "/login" className='d-none d-md-block'>Log In</Link>
                  </>)
                } */}
                {/* {
                  console.log(user)
                } */}
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