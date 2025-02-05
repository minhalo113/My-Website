import React,{useState, useEffect} from 'react'

import Rating from '../components/Rating'
import Link from 'next/link'

const title = "Our Toys"
const btnText = "Start Shopping Now";

const CategoryShowCase = () => {
    const [productData, setProductData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState([]);
    const [activeCategory, setActiveCategory] = useState("All Categories");
    
    useEffect(() =>{
        fetch("/data/products.json").then(res => res.json()).then(data => {setProductData(data); setLoading(false);setItems(data)})
    }, [])

    const filterItem = (categItem) =>{
        if(!productData.length) return;
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
            <div className='section-header' style={{justifyContent:'center'}}>
                <h2 className='title'>
                    {title}
                </h2>
                <div className='course-filter-group'>
                    <ul className='lab-ul' style={{justifyContent: 'center'}}>
                        <li onClick= {() => {setActiveCategory("All Categories");setItems(productData)}} style={{background: activeCategory === "All Categories" ? "#DCA54A" : ""}}>All Categories</li>
                        <li onClick= {() => filterItem("business")} style={{background: activeCategory === "business" ? "#DCA54A" : ""}}>Business</li>
                        <li onClick= {() => filterItem("health")} style={{background: activeCategory === "health" ? "#DCA54A" : ""}}>Health</li>
                        <li onClick= {() => filterItem("history&geography")} style={{background: activeCategory === "history&geography" ? "#DCA54A" : ""}}>History & Geography</li>
                        <li onClick= {() => filterItem("humour")} style={{background: activeCategory === "humour" ? "#DCA54A" : ""}}>Humour</li>
                        <li onClick= {() => filterItem("reference")} style={{background: activeCategory === "reference" ? "#DCA54A" : ""}}>Reference</li>
                        <li onClick= {() => filterItem("religion")} style={{background: activeCategory === "religion" ? "#DCA54A" : ""}}>Religion</li>
                        <li onClick= {() => filterItem("romance")} style={{background: activeCategory === "romance" ? "#DCA54A" : ""}}>Romance</li>
                        <li onClick= {() => filterItem("sciencefiction&fantasy")} style={{background: activeCategory === "sciencefiction&fantasy" ? "#DCA54A" : ""}}>Science Fiction & Fantasy</li>
                        <li onClick= {() => filterItem("self-help")} style={{background: activeCategory === "self-help" ? "#DCA54A" : ""}}>Self-Help</li>
                        <li onClick= {() => filterItem("socialscience")} style={{background: activeCategory === "socialscience" ? "#DCA54A" : ""}}>Social Science</li>
                        <li onClick= {() => filterItem("teen&youngadult")} style={{background: activeCategory === "teen&youngadult" ? "#DCA54A" : ""}}>Teen & Young Adult</li>
                        <li onClick= {() => filterItem("Men's Sneaker")} style={{background: activeCategory === "Men's Sneaker" ? "#DCA54A" : ""}}>Men&apos;s Sneaker</li>
                    </ul>
                </div>
            </div>

            {/* section body */}
            <div className = "section-wrapper">
                <div className='row g-4 justify-content-center row-cols-x1-4 row-cols-lg-3 row-cols-md-2 row-cols-1
                 course-filter' >
                    {items.slice(0, 10).map((product) => 
                        <div key={product.id} className='col'>
                            <div className='course-item style-4'>
                            <div className='course-inner'>
                                <div className='course-thumb'>
                                    <img src = {Array.isArray(product.img) ? product.img[0] : product.img} alt='' />
                                    <div className='course-category'>
                                        <div className='course-cate'><a href={`/shop/${product.id}`}>{product.category}</a></div>
                                        <div className='course-reiew'><Rating/></div>
                                    </div>
                                </div>

                                <div className='course-content'>
                                    <Link href={`/shop/${product.id}`}><h6>{product.name}</h6></Link>
                                    <div className='course-footer'>
                                        <div className='course-author'>
                                        <Link href = {`/shop/${product.id}`} className='ca-name'>{product.seller}</Link>
                                        </div>
                                        <div className='course-price' style={{color: "#DCA54A"}}>
                                            ${product.price}
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