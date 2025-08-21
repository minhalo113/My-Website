import React, {useEffect, useRef, useState} from 'react'
import Link from 'next/link';
import SelectedCategory from '../../components/SelectedCategory';
import api from '../../src/api/api';
import HomeImageSwiper from '../../components/HomeImageSwiper';

const title = (
    <>
        <h2 className="subtitle toy-haven-title">Toy Haven <span role="img" aria-label="teddy">🧸</span></h2>
        <h3>Toys You <span>Love</span>, Prices You Won’t <span>Believe</span>!</h3>
    </>
)

const desc = "🎲 Endless Fun, One Small Price!"

const Banner = () => {
    const [productData, setProductData] = useState([])
    const [categorys, setCategorys] = useState([])
    const [selectedCategory, setSelectedCategory] = useState('all')

    useEffect(() =>{
        const fetchData = async() => {
            try{
                const allProducts = await api.get('/customers-products-get', {withCredentials: true})
                const allCategorys = await api.get('/customers-category-get', {withCredentials: true})
    
                setProductData(allProducts.data.products);
                setCategorys(allCategorys.data.categorys);
            }catch(err){
                console.log(err)
            }finally{
                // setLoading(false);
            }
    }
    fetchData();}
    , [])

    const [searchInput, setSearchInput] = useState("");
    const [filteredProducts, setfilteredProducts] = useState(productData);

    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null)

    const handleSearch = (e) => {
        const searchTerm = e.target.value;
        setSearchInput(searchTerm)

        const filtered = productData.filter((product) => {
            const matchesName = product.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
            return matchesName && matchesCategory;
        });

        setfilteredProducts(filtered)
        setShowDropdown(true);
    }

    const handleCategoryChange = (e) => {
        const newCategory = e.target.value;
        setSelectedCategory(newCategory);

        const filtered = productData.filter((product) => {
            const matchesName = product.name.toLowerCase().includes(searchInput.toLowerCase());
            const matchesCategory = newCategory === "all" || product.category === newCategory;
            return matchesName && matchesCategory;
        })

        setfilteredProducts(filtered);
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
        <div>
        <div className = "banner-section style-4" style = {{overflow: 'hidden', flexWrap:'wrap', paddingBottom: "50px"}}>
            <div className='container-fluid px-0'>
                <div className='banner-content'>
                    {title}
                    <form style={{boxShadow: "0 0 0"}} ref={dropdownRef} onFocus={() => setShowDropdown(true)}>
                    <SelectedCategory
                    select={selectedCategory}
                    allCategorys={categorys}
                    onChange={handleCategoryChange}
                    />

                        <input type = "text" name = "search" id = "search" placeholder='What treasure are you hunting for today?' 
                        value={searchInput} onChange={handleSearch}/>
                        <button type = "submit">
                            <i className='icofont-search'></i>
                        </button>

                        {searchInput && showDropdown && filteredProducts.length > 0 && (
                            <ul className = "dropdown" style={{marginBottom:"0"}}>
                            {
                                searchInput && filteredProducts.slice(0,10).map((product, i) => 
                                    <li key = {i} style={{display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between'}}>
                                    <img src={product.images[0]} style={{width: "100px", height:'auto', marginRight: '10px'}}/>
                                    <Link href = {`/shop/${product._id.toString()}`} style={{flexGrow: 1, textAlign: 'center'}}>{product.name}</Link>
                                    </li>)
                            }
                            </ul>
                            )}
                    </form>

                    <p style={{marginBottom: "50px"}}>{desc}</p>
                </div>
            </div>

        </div>
            <HomeImageSwiper />
        </div>
    )
}
export default Banner;
  