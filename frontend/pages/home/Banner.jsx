import React, { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link';
import SelectedCategory from '../../components/SelectedCategory';
import HomeImageSwiper from '../../components/HomeImageSwiper';
import Image from 'next/image';
import PropTypes from 'prop-types';
import api from '../../src/api/api';
import { ensureHttps } from '../../src/utils/imageUtils';

const title = (
    <>
        <h2 className="subtitle a-figure-a-day-title">A Figure A Day <span role="img" aria-label="figure"></span></h2>
        <h3>Figures You <span>Love</span>, Deals You <span>Watch Daily</span>!</h3>
    </>
)

const desc = "✨ Fresh collectible highlights, carefully packed for your shelf."
const DEBOUNCE_DELAY = 300;

const Banner = () => {
    const [categorys, setCategorys] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('all')

    useEffect(() => {
        let ignore = false;
        const fetchData = async () => {
            try {
                const allCategorys = await api.get('/customers-category-get', { withCredentials: true })
                if (!ignore) {
                    setCategorys(allCategorys.data.categorys || []);
                }
            } catch (err) {
                console.log(err)
            }
        }
        fetchData();
        return () => { ignore = true; }
    }, [])

    const [searchInput, setSearchInput] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const trimmed = searchInput.trim();
        if (!trimmed) {
            setSuggestions([]);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                const params = {
                    q: trimmed,
                    limit: 10,
                    type: 'direct'
                };
                if (selectedCategory !== 'all') {
                    params.category = selectedCategory;
                }

                const { data } = await api.get('/customers-products-search', {
                    params,
                    withCredentials: true
                });

                if (Array.isArray(data?.results)) {
                    setSuggestions(data.results);
                    setShowDropdown(true);
                }
            } catch (error) {
                console.error("Banner search error:", error);
            }
        }, DEBOUNCE_DELAY);

        return () => clearTimeout(timer);
    }, [searchInput, selectedCategory]);

    const handleSearchInput = (e) => {
        setSearchInput(e.target.value);
    }

    const handleCategoryChange = (e) => {
        setSelectedCategory(e.target.value);
    }

    return (
        <div>
            <div className="banner-section style-4" style={{ overflow: 'hidden', flexWrap: 'wrap', paddingBottom: "50px", position: 'relative' }}>
                <div className='container-fluid px-0'>
                    <div className='banner-content'>
                        {title}
                        <form style={{ boxShadow: "0 0 0" }} ref={dropdownRef} onSubmit={(e) => e.preventDefault()}>
                            <SelectedCategory
                                select={selectedCategory}
                                allCategorys={categorys}
                                onChange={handleCategoryChange}
                            />

                            <input
                                type="text"
                                name="search"
                                id="search"
                                placeholder='What treasure are you hunting for today?'
                                value={searchInput}
                                onChange={handleSearchInput}
                                onFocus={() => {
                                    if (searchInput && suggestions.length > 0) setShowDropdown(true);
                                }}
                                autoComplete="off"
                            />
                            <button type="submit">
                                <i className='icofont-search'></i>
                            </button>

                            {showDropdown && suggestions.length > 0 && (
                                <ul className="dropdown" style={{ marginBottom: "0" }}>
                                    {
                                        suggestions.map((product, i) =>
                                            <li key={product._id?.toString() || i} style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ width: "60px", height: '60px', marginRight: '10px', position: 'relative', flexShrink: 0 }}>
                                                    <Image
                                                        src={ensureHttps(product.images?.[0] || "/placeholder.png")}
                                                        alt={product.name}
                                                        fill
                                                        sizes="60px"
                                                        style={{ objectFit: "cover", borderRadius: "4px" }}
                                                    />
                                                </div>
                                                <Link
                                                    href={`/shop/${product._id.toString()}-${product.slug}`}
                                                    style={{ flexGrow: 1, textAlign: 'left', textDecoration: 'none', color: 'inherit', fontWeight: '500' }}
                                                    onClick={() => setShowDropdown(false)}
                                                >
                                                    {product.name}
                                                </Link>
                                            </li>
                                        )
                                    }
                                </ul>
                            )}
                        </form>
                        <p style={{ marginBottom: "50px" }}>{desc}</p>
                    </div>
                </div>

            </div>
        </div>
    )
}

Banner.propTypes = {
    products: PropTypes.array,
    categorys: PropTypes.array,
    swiperItems: PropTypes.array,
};

export default Banner;