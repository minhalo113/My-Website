import React,{useState, useEffect} from 'react'
import api from '../../src/api/api.js'
import Rating from '../../components/Rating'
import Link from 'next/link'
import DiscountBadge from '../../components/DiscountBadge'


const title = "Our Products"
const btnText = "Start Shopping Now";

const CategoryShowCase = () => {
    const [productData, setProductData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);

    const [allCategories, setAllCategories] = useState([])
    const [activeCategory, setActiveCategory] = useState("All Categories");

    useEffect(() =>{
        const fetchData = async() => {
            try{
                const allProducts = await api.get('/customers-products-get', {withCredentials: true})
                const allCategories = await api.get('/customers-category-get', {withCredentials: true})

                setProductData(allProducts.data.products);
                setItems(allProducts.data.products);
                setAllCategories(allCategories.data.categorys);
            }catch(err){
                console.log(err)
            }finally{
                setLoading(false);
            }
        };

        fetchData();
    }, [])

    const filterItem = (categItem) =>{
        if(!productData.length) {
            return;
        }
        const updateItems = productData.filter((curElem) => {
            return curElem.category === categItem
        });
        setItems(updateItems);
        setActiveCategory(categItem);
    }

    if (loading) return <p>Loading product details...</p>

  return (
    <div className='course-section style-3 padding-tb'>
        <div>
            {/*shape*/}
            <img className='course-shape one combined-effect' src = "/images/shape-img/icon/circle-background.png" style={{width:'100px', height: 'auto'}}>
            </img>
            <img className='course-shape two drip-glow-effect' src = "/images/shape-img/icon/circle-background-2.png" style={{width:'100px', height: 'auto'}}>
            </img>
            </div>
        
        {/*main section*/}
        <div className='container' >
            {/* section header */}
            <div className='section-header flex flex-col items-center gap-4' style={{justifyContent:'center'}}>
                <h2 className='title'>
                    {title}
                </h2>
                <div className='course-filter-group'>
                    <ul className='lab-ul' style={{justifyContent: 'center'}}>
                        <li onClick= {() => {setActiveCategory("All Categories");setItems(productData)}} style={{background: activeCategory === "All Categories" ? "#DCA54A" : ""}}>All Categories</li>
                        {
                            allCategories.map((category, index) => 
                                <li key = {index} onClick={() => {filterItem(category.name)}} style = {{background: activeCategory === category.name ? "#DCA54A" : ""}}>{category.name}</li>
                            )
                        }
                    </ul>
                </div>
            </div>

            {/* section body */}
            <div className = "section-wrapper">
                <div className='row g-4 justify-content-center row-cols-x1-4 row-cols-lg-3 row-cols-md-2 row-cols-1
                 course-filter' >
                    {items.slice(0, 12).map((product) => 
                        <div key={product._id.toString()} className='col'>
                            <div className='course-item style-4'>
                            <div className='course-inner'>
                                <div className='course-thumb relative'>
                                    <img src={Array.isArray(product.images) ? product.images[0] : product.images} alt='' />
                                    <DiscountBadge discount={product.discount} />
                                    <div className='course-category'>
                                        <div className='course-cate'><a href={`/shop/${product._id.toString()}`}>{product.category}</a></div>
                                        <div className='course-reiew'><Rating rating={product.averageRating} number_of_ratings= {product.reviewCount}/></div>
                                    </div>
                                </div>

                                <div className='course-content'>
                                    <Link href={`/shop/${product._id.toString()}`}><h6>{product.name}</h6></Link>
                                    <div className='course-footer'>
                                        <div className='course-author'>
                                        <Link href = {`/shop/${product._id.toString()}`} className='ca-name'>{product.seller}</Link>
                                        </div>
                                        <div className='course-price' style={{color: "#DCA54A"}}>
                                            {(() => {
                                                const hasVariant =
                                                    product.colors &&
                                                    product.colors.length > 0 &&
                                                    Array.isArray(product.colorPrices) &&
                                                    product.colorPrices.length > 0;

                                                if (hasVariant) {
                                                    const prices = product.colors
                                                        .map((c, idx) => product.colorPrices[idx])
                                                        .filter(v => v !== undefined);
                                                    const min = Math.min(...prices);
                                                    const max = Math.max(...prices);
                                                    const minBase = min.toFixed(2);
                                                    const maxBase = max.toFixed(2);
                                                    if (product.discount > 0) {
                                                        const minDiscount = (min - (min * product.discount) / 100).toFixed(2);
                                                        const maxDiscount = (max - (max * product.discount) / 100).toFixed(2);

                                                        if (minBase === maxBase) {
                                                            return (
                                                                <>
                                                                    ${minDiscount}
                                                                    <del className='text-sm text-gray-500 ml-1'>
                                                                        ${minBase}
                                                                    </del>
                                                                </>
                                                            );
                                                        }

                                                        return (
                                                            <>
                                                                ${minDiscount}
                                                                <del className='text-sm text-gray-500 ml-1'>
                                                                    ${minBase}
                                                                </del>
                                                                {` - `}
                                                                ${maxDiscount}
                                                                <del className='text-sm text-gray-500 ml-1'>
                                                                    ${maxBase}
                                                                </del>
                                                            </>
                                                        );
                                                    }

                                                    if (minBase === maxBase) {
                                                        return `$${minBase}`;
                                                    }
                                                    return `$${minBase} - $${maxBase}`;
                                                }

                                                if (product.discount > 0) {
                                                    const discountedPrice = (
                                                        product.price -
                                                        (product.price * product.discount) / 100
                                                    ).toFixed(2);
                                                    return (
                                                        <>
                                                            ${discountedPrice}
                                                            <del className='text-sm text-gray-500 ml-1'>
                                                                ${product.price}
                                                            </del>
                                                        </>
                                                    );
                                                }

                                                return `$${product.price}`;
                                            })()}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                        </div> )}

                </div>
                <div className='text-center mt-5'>
                    <Link href = "/shop" className='lab-btn' style={{background:"#DCA54A"}}><span style={{color: '#101115'}}>{btnText}</span></Link>
                </div>
            </div>
        </div>
    </div>
  )
}

export default CategoryShowCase