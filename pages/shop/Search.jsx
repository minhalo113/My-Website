import React from 'react'
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Search = ({products}) => {
    const [searchTerm, setSearchTerm] = useState("");
    
    const [showDropdown, setShowDropdown] = useState(true)
    const dropdownRef = useRef(null)
    
    const filteredProducts = products.filter((products) => {
        return products.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if(dropdownRef.current && !dropdownRef.current.contains(event.target)){
                setShowDropdown(false);
            }
            else if (dropdownRef.current && dropdownRef.current.contains(event.target)){
                setShowDropdown(true);
            }
        ;}

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, []);

  return (
    <div className='widget widget-search'>
        <form className='search-wrapper mb-3' ref={dropdownRef}>
            <input type='text' name= "search" id = "search" placeholder='Search...' defaultValue={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}/>

            <button type='submit'>
                <i className='icofont-search-2'></i>
            </button>
        </form>

        <div  style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: "400px", overflowY :"auto"}}>
            {
                searchTerm && showDropdown && filteredProducts.slice(0, 20).map((product) => (
                    <Link key = {product.id} to = {`/shop/${product.id}`}>
                        <div className='d-flex gap-3 p-2'>
                            <div>
                                <div className='pro-thumb h-25'>
                                    <img src = {product.img} alt = "" width = {70} className='flex-{grow|shrink}-0'/>
                                </div>
                            </div>

                            <div className='product-content'>
                                <p>
                                    <Link to = {`/shop/${product.id}`}>
                                    {product.name}
                                    </Link>
                                </p>
                                <h6>
                                    ${product.price}
                                </h6>
                            </div>
                        </div>
                    </Link>
                ))
            }
        </div>
    </div>
  )
}

Search.propTypes = {
    products: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            name: PropTypes.string.isRequired,
            img: PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired,
            price: PropTypes.number.isRequired,
        })
    ).isRequired,
};

export default Search