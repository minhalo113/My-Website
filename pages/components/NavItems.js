import { useState, useEffect, useContext } from "react";
import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from 'aws-amplify/auth';
import { signOut } from "aws-amplify/auth"
import {useRouter} from "next/router";
import { useRouteError } from "react-router-dom";

// import { AuthContext } from '../contexts/AuthProvider';

const NavItems = () => {
  const [menuToggle, setMenuToggle] = useState(false);
  const [socialToggle, setSocialToggle] = useState(false);
  const [headerFixed, setHeaderFixed] = useState(false);

  // authInfo
  const [user, setUser] = useState(null);
  const router = useRouter();

  async function currentAuthenticatedUser(){
    try {
      const {username, userId, signInDetails} = await getCurrentUser();
      setUser(username);
    }catch (error){
      console.log(error);
      setUser(null);
    }
  }

  // add event listener check user auth
  useEffect(() => {
    currentAuthenticatedUser();
    const handleScroll = () => {
      setHeaderFixed(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []); 

  const logOut = async () => {
    try{
      await signOut();
      console.log("already logout")
      currentAuthenticatedUser()
      router.push("/")
    }catch(error){
      console.log("error signing out: ", error);
    }
  }

  return (
    <header  className={`header-section style-4 ${headerFixed ? "header-fixed fadeInUp" : ""}`}>
      {/* header top start */}
      <div className={`header-top d-md-none ${socialToggle ? "open" : ""}`} >
          <div>
            <div className='container'>
              <div className='header-top-area'>
                <Link href = "/sign-up" className='custom-lab-btn lab-btn me-3'>
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

                {
                  console.log(user)
                }
                {/* sign in and log in */}
                { user ? 
                (<><Link href = "/" className='d-none d-md-block' onClick={logOut}>Log Out</Link></>
                ): 
                (<>
                    <Link href = "/sign-up" className='custom-lab-btn lab-btn me-3 d-none d-md-block'>Create Account</Link>
                    <Link href = "/login" className='d-none d-md-block'>Log In</Link>
                  </>)
                }
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
                {!user ? (
                  <div className='ellepsis-bar d-md-none' onClick={() => setSocialToggle(!socialToggle)}>
                    <i className = "icofont-info-square"></i>
                  </div>
                ) : (
                  <div className='ellepsis-bar d-md-none'>
                    <i class="icofont-exit" onClick={()  => {logOut(); setSocialToggle(true)}}>
                    </i>
                  </div>
                )
              }
              </div>
          </div>
        </div>
      </div>
    </header>
  )
}

export default NavItems