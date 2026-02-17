
import { useState, useEffect, useContext, useRef } from "react";
import Link from "next/link";
import Image from 'next/image';

import toast from "react-hot-toast"
import { useRouter } from "next/router";

import { AuthContext } from "../context/AuthContext.jsx";
import api from '../src/api/api.js'
import { ensureHttps } from '../src/utils/imageUtils.js';

// import { AuthContext } from '../contexts/AuthProvider';

const NavItems = () => {
  const [menuToggle, setMenuToggle] = useState(false);
  const [socialToggle, setSocialToggle] = useState(false);
  const [headerFixed, setHeaderFixed] = useState(false);
  const [navSearchValue, setNavSearchValue] = useState("");
  const [navSuggestions, setNavSuggestions] = useState([]);
  const [showNavDropdown, setShowNavDropdown] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const searchRef = useRef(null);
  const accountRef = useRef(null);

  // authInfo
  const { user, setUser, loading } = useContext(AuthContext)
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


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowNavDropdown(false);
      }
      if (accountRef.current && !accountRef.current.contains(event.target)) {
        setAccountOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);


  useEffect(() => {
    const trimmed = navSearchValue.trim();
    if (!trimmed) {
      setNavSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const params = {
          q: trimmed,
          limit: 5,
          type: 'direct'
        };

        const { data } = await api.get('/customers-products-search', {
          params,
          withCredentials: true
        });

        if (Array.isArray(data?.results)) {
          setNavSuggestions(data.results);
          setShowNavDropdown(true);
        }
      } catch (error) {
        console.error("Nav search error:", error);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [navSearchValue]);

  const logOut = async () => {
    try {
      setUser(null)
      const { data } = await api.get('/customer/logout', { withCredentials: true })
      localStorage.removeItem("chatUserId");
      toast.success(data.message)
      router.push("/")
    } catch (error) {
      const msg = error?.response?.data?.error || "Unexpected error occurred."
      toast.error("Error signing out: ", msg);
    }
  }

  const handleNavSearch = (e) => {
    e.preventDefault();
    if (navSearchValue.trim()) {
      router.push({
        pathname: '/shop/direct-store',
        query: { search: navSearchValue.trim() }
      });
      setMenuToggle(false);
      setShowNavDropdown(false);
      setNavSearchValue("");
    }
  };


  if (loading) return null

  return (
    <>
      <style jsx>{`
      .custom-hover-override:hover {
        background: #000000 !important;
      }
      .nav-search-form {
        display: flex;
        align-items: center;
        background: #f3f4f6;
        border-radius: 99px;
        padding: 8px 20px;
        width: 100%;
        max-width: 500px;
        min-width: 200px;
        margin: 0 15px; 
        transition: all 0.3s ease;
        position: relative; /* For absolute dropdown positioning */
        border: 1px solid transparent;
      }

      .nav-search-form:focus-within {
        background: #fff;
        border-color: #DCA54A;
        box-shadow: 0 0 0 2px rgba(220, 165, 74, 0.1);
      }
      
      .nav-search-input {
        background: transparent;
        border: none;
        outline: none;
        font-size: 15px;
        width: 100%;
        flex: 1;
        min-width: 50px;
        color: #333;
        padding: 0;
      }
      
      .nav-search-btn {
        background: transparent;
        border: none;
        color: #DCA54A;
        cursor: pointer;
        padding: 0;
        display: flex;
        align-items: center;
        margin-left: 8px;
        font-size: 18px;
      }

      /* Dropdown Styles */
      .nav-search-dropdown {
        position: absolute;
        top: calc(100% + 8px);
        left: 0;
        right: 0;
        background: white;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        border-radius: 12px;
        padding: 8px 0;
        margin: 0;
        list-style: none;
        z-index: 1000;
        max-height: 450px;
        overflow-y: auto;
        border: 1px solid #f3f4f6;
        overflow: hidden;
      }

      .nav-search-dropdown li {
        border-bottom: 1px solid #f9fafb;
      }

      .nav-search-dropdown li:last-child {
        border-bottom: none;
      }

      .nav-search-item {
         display: flex;
         align-items: center;
         padding: 10px 16px;
         width: 100%;
         text-decoration: none;
         color: inherit;
         transition: background 0.2s;
         gap: 12px;
      }

      .nav-search-item:hover {
          background-color: #fffbeb; /* Very light yellow tint on hover */
      }

      .nav-item-image {
          width: 48px;
          height: 48px;
          flex-shrink: 0;
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          background-color: #f3f4f6;
          border: 1px solid #e5e7eb;
      }

      .nav-item-content {
        flex-grow: 1;
        min-width: 0; /* Enable truncation in flex item */
      }

      .nav-item-text {
          display: block;
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          line-height: 1.4;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
      }
      
      .nav-item-subtext {
        display: block;
        font-size: 12px;
        color: #9ca3af;
        margin-top: 2px;
      }

      .nav-search-footer {
        padding: 10px 16px;
        text-align: center;
        background-color: #f9fafb;
        border-top: 1px solid #f3f4f6;
      }

      .nav-search-footer a {
        font-size: 13px;
        font-weight: 600;
        color: #DCA54A;
        text-decoration: none;
      }
      
      .nav-search-footer a:hover {
        text-decoration: underline;
      }

      /* Account Dropdown */
      .account-menu {
          position: relative;
          display: inline-block;
      }
      
      .account-btn {
          cursor: pointer;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 8px 0;
      }
      
      .account-dropdown {
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          min-width: 180px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
          border-radius: 8px;
          padding: 8px 0;
          z-index: 1001;
          border: 1px solid #f3f4f6;
      }
      
      .account-dropdown li a, .account-dropdown li button {
          display: block;
          padding: 8px 16px;
          width: 100%;
          text-align: left;
          color: #333;
          font-size: 14px;
          background: none;
          border: none;
          cursor: pointer;
          transition: background 0.2s;
      }
      
      .account-dropdown li a:hover, .account-dropdown li button:hover {
          background-color: #f9fafb;
          color: #DCA54A;
      }


      /* Flexbox layout overrides */
      .header-wrapper {
        display: flex !important;
        justify-content: space-between !important;
        align-items: center !important;
        flex-wrap: nowrap !important;
        gap: 15px;
      }

      .logo-search-acte {
        flex-shrink: 0;
        width: auto !important;
      }
      
      .menu-area {
        flex-shrink: 0;
        margin-left: 0 !important;
        display: flex;
        align-items: center;
        gap: 15px;
      }

      /* Ensure logo doesn't overflow */
      .logo a {
        display: flex;
        align-items: center;
      }

      @media (max-width: 991px) {
        .nav-search-form {
           margin: 0 8px;
           padding: 6px 12px;
           max-width: 100%; 
           flex-grow: 1; 
           min-width: 0; /* Important for flex items to shrink below content size */
        }
        
        .nav-search-input {
             font-size: 14px; 
             min-width: 0;
        }

        .header-wrapper {
            padding: 10px 0;
            gap: 5px; /* Reduce gap on mobile */
        }
        
        /* Adjust logo size on mobile */
        .logo img {
            max-width: 90px; /* Slightly smaller logo */
            height: auto;
        }

        /* Adjust hamburger menu spacing */
        .header-bar {
            margin-left: 5px;
            width: 25px; /* Ensure icon doesn't take too much space */
        }
        
        .menu-area {
            gap: 5px;
        }

        .ellepsis-bar i {
            font-size: 20px;
        }
      }
      
      /* Very small screens */
      @media (max-width: 380px) {
         .logo img {
            max-width: 70px;
        }
        .nav-search-form {
            padding: 5px 10px;
        }
      }
    `}</style>

      <header className={`header-section style-4 ${headerFixed ? "header-fixed fadeInUp" : ""}`}>
        {/* header top start */}
        <div className={`header-top d-md-none ${socialToggle ? "open" : ""}`} >

          <div className='container'>
            <div className='header-top-area'>
              <Link href="/sign-up" className='custom-lab-btn lab-btn me-3'>
                <span>Create Account</span>
              </Link>
              <Link href="/login">
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
                  <Link href={"/"}>
                    <Image src="/images/logo/myLogo.png" alt="" width={120} height={120} />
                  </Link>
                </div>
              </div>

              {/* Center Search Bar */}
              <form ref={searchRef} onSubmit={handleNavSearch} className="nav-search-form">
                <input
                  type="text"
                  placeholder="Search..."
                  className="nav-search-input"
                  value={navSearchValue}
                  onChange={(e) => setNavSearchValue(e.target.value)}
                  onFocus={() => {
                    if (navSearchValue && navSuggestions.length > 0) setShowNavDropdown(true);
                  }}
                  autoComplete="off"
                />
                <button type="submit" className="nav-search-btn">
                  <i className="icofont-search"></i>
                </button>

                {/* Dropdown Suggestions */}
                {showNavDropdown && navSuggestions.length > 0 && (
                  <ul className="nav-search-dropdown">
                    {navSuggestions.map((product, i) => (
                      <li key={product._id?.toString() || i}>
                        <Link
                          href={`/shop/${product._id?.toString()}-${product.slug}`}
                          className="nav-search-item"
                          onClick={() => setShowNavDropdown(false)}
                        >
                          <div className="nav-item-image">
                            <Image
                              src={ensureHttps(product.coverImage || product.images?.[0] || "/placeholder.png")}
                              alt={product.name}
                              fill
                              sizes="48px"
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                          <div className="nav-item-content">
                            <span className="nav-item-text">{product.name}</span>
                            <span className="nav-item-subtext">
                              {product.price ? `$${product.price}` : 'View Product'}
                            </span>
                          </div>
                        </Link>
                      </li>
                    ))}
                    {/* View All Footer */}
                    <li className="nav-search-footer">
                      <Link href={`/shop/direct-store?search=${navSearchValue}`} onClick={() => setShowNavDropdown(false)}>
                        View all results for "{navSearchValue}"
                      </Link>
                    </li>
                  </ul>
                )}
              </form>

              {/* menu area */}
              <div className='menu-area'>
                <div className='menu'>
                  <ul className={`lab-ul ${menuToggle ? "active" : ""}`}>
                    <li>
                      <Link href="/">
                        Home
                      </Link>
                    </li>
                    <li>
                      <Link href="/shop/direct-store">
                        Shop
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog">
                        Blog
                      </Link>
                    </li>
                    <li>
                      <Link href="/about">
                        About
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact">
                        Contact
                      </Link>
                    </li>
                    <li>
                      <Link href="/track-order">
                        Track Order
                      </Link>
                    </li>
                    <li>
                      <Link href="/cart-page">
                        Cart
                      </Link>
                    </li>

                    {user && (
                      <li
                        ref={accountRef}
                        className="flex flex-col border-t border-[rgba(16,17,21,0.1)] lg:border-none">
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
                            <li><Link href="/profile" className="block py-1 custom-hover-override" style={{ paddingLeft: '2.5rem' }}>Profile</Link></li>
                            <li><Link href="/wishlist" className="block py-1 custom-hover-override" style={{ paddingLeft: '2.5rem' }}>Wishlist</Link></li>
                            <li><Link href="/history" className="block py-1 custom-hover-override" style={{ paddingLeft: '2.5rem' }}>Orders</Link></li>
                            {/* <li><button onClick={logOut} className="block py-1 custom-hover-override w-full text-left" style={{ paddingLeft: '2.5rem' }}>Log Out</button></li> */}
                          </ul>
                        )}

                      </li>
                    )}
                  </ul>
                </div>


                {user ?
                  (<><Link href="/" className='d-none d-md-block' onClick={logOut}>Log Out</Link></>
                  ) :
                  (<>
                    <Link href="/sign-up" className='custom-lab-btn lab-btn me-3 d-none d-md-block'>Create Account</Link>
                    <Link href="/login" className='d-none d-md-block'>Log In</Link>
                  </>
                  )}
                {/* menu toggler */}
                <div onClick={() => setMenuToggle(!menuToggle)} className={`header-bar d-lg-none ${menuToggle ? "active" : ""}`}>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>

                {/* social toggler (Keep for mobile logout icon fallback) */}
                {!user ? (
                  <div className='ellepsis-bar d-md-none' onClick={() => setSocialToggle(!socialToggle)}>
                    <i className="icofont-info-square"></i>
                  </div>
                ) : (
                  <div className='ellepsis-bar d-md-none'>
                    <i className="icofont-exit" onClick={() => { logOut(); setSocialToggle(true) }}>
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