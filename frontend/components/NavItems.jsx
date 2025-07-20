import { useState, useEffect, useContext } from "react";
import Link from "next/link";

import toast from "react-hot-toast"
import {useRouter} from "next/router";

import { AuthContext } from "../context/AuthContext";
import api from '../src/api/api.js'

// import { AuthContext } from '../contexts/AuthProvider';

const NavItems = () => {
  const [menuToggle, setMenuToggle] = useState(false);
  const [socialToggle, setSocialToggle] = useState(false);
  const [headerFixed, setHeaderFixed] = useState(false);

  const [accountOpen, setAccountOpen] = useState(false);

  // authInfo
  const {user, setUser, loading} = useContext(AuthContext)
  const router = useRouter();

  useEffect(() => {
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
      setUser(null)
      const {data} = await api.get('/customer/logout', {withCredentials: true})
      localStorage.removeItem("chatUserId");
      toast.success(data.message)
      router.push("/")
    }catch(error){
      const msg = error?.response?.data?.error || "Unexpected error occurred."
      toast.error("Error signing out: ", msg);
    }
  }

  if(loading) return null

  return (
    <>
    <style>
    {`
      .custom-hover-override:hover {
        background: #000000 !important;
      }
    `}
    </style>

    <header className={`header-section style-4 ${headerFixed ? "header-fixed fadeInUp" : ""}`}>
      {/* header top start */}
      <div className={`header-top d-md-none ${socialToggle ? "open" : ""}`} >

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
                      <li>
                      <Link
                        href="/"
                        className="inline-block transition-transform duration-200 hover:-translate-y-1"
                      >
                        Home
                      </Link>
                    </li>

                    <li>
                    <Link
                      href="/shop"
                      className="inline-block transition-transform duration-200 hover:-translate-y-1"
                    >
                      Shop
                    </Link>
                  </li>

                  <li >
                    <Link
                      href="/blog"
                      className="inline-block transition-transform duration-200 hover:-translate-y-1"
                    >
                      Blog
                    </Link>
                  </li>

                  <li>
                    <Link
                      href="/about"
                      className="inline-block transition-transform duration-200 hover:-translate-y-1"
                    >
                      About
                    </Link>
                  </li>

                  <li >
                    <Link
                      href="/cart-page"
                      className="inline-block transition-transform duration-200 hover:-translate-y-1"
                    >
                      Cart
                    </Link>
                  </li>

            
                    {user && (
                      <li
                      className = "flex flex-col border-t border-[rgba(16,17,21,0.1)] lg:border-none">
                        <button
                        className="cursor-pointer hover:bg-amber-500/80 text-black button-custom-hover-override"
                        style={{
                          padding: '10px 25px',
                          fontWeight: 700,
                          textTransform: 'capitalize',
                          color: '#101115',
                          width: '100%',
                          fontSize: '15px',
                          textAlign: 'left',
                          height: '100%',
                        }}                        
                        onClick={() => setAccountOpen(!accountOpen)}
                        >
                          Account
                        </button>

                        {accountOpen && (
                          <ul style={{
                              display: 'block',
                            }}>
                            <li><Link href="/profile" className="block py-1 custom-hover-override" style = {{paddingLeft: '2.5rem'}}>Profile</Link></li>
                            <li><Link href="/wishlist" className="block py-1 custom-hover-override" style = {{paddingLeft: '2.5rem'}}>Wishlist</Link></li>
                            <li><Link href="/history" className="block py-1 custom-hover-override" style = {{paddingLeft: '2.5rem'}}>History</Link></li>
                          </ul>
                        )}

                    </li>
                    )}
                  </ul>
                </div>

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
                    <i className="icofont-exit" onClick={()  => {logOut(); setSocialToggle(true)}}>
                    </i>
                  </div>
                )
              }
              </div>
          </div>
        </div>
      </div>
    </header>
    </>
  )
}

export default NavItems