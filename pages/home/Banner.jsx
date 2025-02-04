import React, {useEffect, useRef, useState} from 'react'
import productData from "../products.json"
import { Link } from 'react-router-dom';
import SelectedCategory from '../components/SelectedCategory';
import Select from 'react-select/base';


const title = (
    <h2>Toys You <span>Love</span>, Prices You Won’t <span>Believe</span>!</h2>
)

const desc = "🎲 Endless Fun, One Small Price!"

const Banner = () => {
    const [searchInput, setSearchInput] = useState("");
    const [filteredProducts, setfilteredProducts] = useState(productData);

    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null)

    const handleSearch = (e) => {
        const searchTerm = e.target.value;
        setSearchInput(searchTerm)

        const filtered = productData.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()));

        setfilteredProducts(filtered)
        setShowDropdown(true);
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)){
                setShowDropdown(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };

    }, []);

    return (
        <div className = "banner-section style-4" style = {{overflow: 'hidden', flexWrap:'wrap', height:'1000px'}}>
            <div className='container'>
                <div className='banner-content'>
                    {title}
                    <form style={{boxShadow: "0 0 0", marginBottom: "1rem"}} ref={dropdownRef} onFocus={() => setShowDropdown(true)}>
                        <SelectedCategory select = {"all"}/>
                        <input type = "text" name = "search" id = "search" placeholder='What treasure are you hunting for today?' 
                        value={searchInput} onChange={handleSearch}/>
                        <button type = "submit">
                            <i className='icofont-search'></i>
                        </button>

                        {searchInput && showDropdown && filteredProducts.length > 0 && (
                            <ul class = "dropdown" style={{marginBottom:"0"}}>
                            {
                                searchInput && filteredProducts/*.slice(0,10)*/.map((product, i) => 
                                <li key = {i} style={{display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between'}}>
                                    <img src={product.img} style={{width: "100px", height:'auto', marginRight: '10px'}}/>
                                    <Link to = {`/shop/${product.id}`} style={{flexGrow: 1, textAlign: 'center'}}>{product.name}</Link>
                                    </li>)
                            }
                            </ul>
                            )}
                    </form>

                    <p>{desc}</p>
                </div>
            </div>

        </div>
    )
}
export default Banner;
  