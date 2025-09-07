import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IoMdImages } from "react-icons/io";
import { IoMdCloseCircle } from "react-icons/io";
import { useDispatch, useSelector } from 'react-redux';
import { get_category } from '../../store/Reducers/categoryReducer';
import { add_product, messageClear, import_aliexpress_product } from '../../store/Reducers/productReducer';
import { PropagateLoader } from 'react-spinners';
import { overrideStyle, extractColors } from '../../utilis/utils';
import toast from 'react-hot-toast';

const AddProduct = () => {
    const dispatch = useDispatch()
    const { categorys } = useSelector(state => state.category)

    const { loader,successMessage,errorMessage, importedProduct } = useSelector(state => state.product)

    useEffect(() => {
        dispatch(get_category({
            searchValue: '',
            parPage: '',
            page: ""
        }))
    }, [])
     

    const [state, setState] = useState({
        name: "",
        description: '',
        discount: '',
        price: "",
        brand: "Toy Haven",
        stock: "",
        sizes: '',
        deliveryTime: '',
        colorPrices: '',
        link: ''
    })

    const [importUrl, setImportUrl] = useState('')

    const inputHandle = (e) => {
        setState({
            ...state,
            [e.target.name] : e.target.value
        })

    }

    const importHandle = () => {
        if(importUrl){
            dispatch(import_aliexpress_product(importUrl))
            setState(prev => ({...prev, link: importUrl}))
            setImportUrl('')
        }
    }

    const formattedImportResponse = useMemo(() => {
        if (!importedProduct) return '';
        const jsonString = JSON.stringify(importedProduct, null, 2)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        const urlRegex = /(https?:\/\/[^\s",]+)/g;
        return jsonString.replace(urlRegex, url => `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-blue-400 underline break-all">${url}</a>`);
    }, [importedProduct]);

    const [cateShow, setCateShow] = useState(false)
    const [category, setCategory] = useState('')
    const [allCategory, setAllCategory] = useState([])
    const [searchValue, setSearchValue] = useState('') 
  
    const categorySearch = (e) => {
        const value = e.target.value
        setSearchValue(value)
        if (value) {
            let srcValue = allCategory.filter(c => c.name.toLowerCase().indexOf(value.toLowerCase()) > -1)
            setAllCategory(srcValue)
        } else {
            setAllCategory(categorys)
        }

    }

    const [images, setImages] = useState([])
    const [imageShow, setImageShow] = useState([])
    const [colorImages, setColorImages] = useState([])
    const [colorImageShow, setColorImageShow] = useState([])

    const [videos, setVideos] = useState([])
    const [videoNames, setVideoNames] = useState([])

    const imageHandle = (e) => {
        const files = e.target.files
        const length = files.length;
        if (length > 0) {
            setImages([...images, ...files])
            let imageUrl = []
            for (let i = 0; i < length; i++) {
                imageUrl.push({url: URL.createObjectURL(files[i])}) 
            }
            setImageShow([...imageShow, ...imageUrl])
        }
    }

    const colorImageHandle = (e) => {
        const files = e.target.files
        const length = files.length

        if (length > 0){
            setColorImages([...colorImages, ...files])
            let imageUrl = []
            for (let i = 0; i < length; ++i){
                imageUrl.push({url: URL.createObjectURL(files[i])})
            }
            setColorImageShow([...colorImageShow, ...imageUrl])
        }
    }

    const videoHandle = (e) => {
        const files = e.target.files
        const length = files.length
        if (length > 0){
            setVideos([...videos, ...files])
            let names = []
            for (let i = 0; i < length ; ++i){
                names.push(files[i].name)
            }
            setVideoNames([...videoNames, ...names])
        }
    }

    useEffect(() => {

        if (successMessage) {
            toast.success(successMessage)
            dispatch(messageClear()) 
            setState({
                name: "",
                description: '',
                discount: '',
                price: "",
                brand: "Toy Haven",
                stock: "",
                sizes: '',
                deliveryTime: '',
                colorPrices: '',
                link: ''
            }) 
            setImageShow([])
            setImages([])
            setColorImageShow([])
            setColorImages([])
            setVideos([])
            setVideoNames([])
            setCategory('')
        }
        if (errorMessage) {
            toast.error(errorMessage)
            dispatch(messageClear())
        }
    },[successMessage,errorMessage])

    const changeImage = (img, index) => {
        if (img) {
            let tempUrl = imageShow
            let tempImages = images

            tempImages[index] = img
            tempUrl[index] = {url : URL.createObjectURL(img)}
            setImageShow([...tempUrl])
            setImages([...tempImages])

        }
    }

    const removeImage = (i) => {
        const filterImage = images.filter((img,index) => index !== i)
        const filterImageUrl = imageShow.filter((img, index) => index !== i )

        setImages(filterImage)
        setImageShow(filterImageUrl)
    }

        const changeColorImage = (img, index) => {
        if (img) {
            let tempUrl = colorImageShow
            let tempImages = colorImages

            tempImages[index] = img
            tempUrl[index] = {url: URL.createObjectURL(img)}
            setColorImageShow([...tempUrl])
            setColorImages([...tempImages])

        }
    }

    const removeColorImage = (i) => {
        const filterImage = colorImages.filter((img,index) => index !== i)
        const filterImageUrl = colorImageShow.filter((img, index) => index !== i )

        setColorImages(filterImage)
        setColorImageShow(filterImageUrl)
    }
    
    const add = (e) => {
        e.preventDefault()

        const colorArr = extractColors(state.colorPrices)

        if(colorArr.length !== colorImages.length){
            toast.error('Number of colors and color images must match')
            return
        }

        const formData = new FormData()
        formData.append('name',state.name)
        formData.append('description',state.description)
        formData.append('price',state.price)
        formData.append('stock',state.stock)
        formData.append('discount',state.discount)
        formData.append('deliveryTime', state.deliveryTime)
        formData.append('colorPrices', state.colorPrices)
        formData.append('brand',state.brand)
        formData.append('link', state.link)
        formData.append('colors', colorArr.join(','))
        formData.append('sizes', state.sizes)
        formData.append('shopName','Toy Haven') 
        formData.append('category',category)

        for (let i = 0; i < images.length; i++) {
            formData.append('images',images[i]) 
        }

        for (let i = 0; i < colorImages.length ; ++i ){
            formData.append('colorImages', colorImages[i])
        }
        
        for (let i = 0; i < videos.length; ++i){
            formData.append('videos', videos[i])
        }

        dispatch(add_product(formData))
    }

    useEffect(() => {
        setAllCategory(categorys)
    },[categorys])

 
    return (
        <div className='px-2 lg:px-7 pt-5'>
            <div className='w-full p-4 bg-[#6a5fdf] rounded-md'>
                <div className='flex justify-between items-center pb-4'>
                    <h1 className='text-[#d0d2d6] text-xl font-semibold'>Add Product</h1>
                    <Link to='/admin/dashboard/products' className='bg-blue-500 hover:shadow-blue-500/50 hover:shadow-lg text-white rounded-sm px-7 py-2 my-2'>All Product</Link> 
                </div>
<div>
<form onSubmit={add}>
        <div className='flex flex-col mb-3 w-full text-[#d0d2d6]'>
            <label htmlFor='importUrl'>AliExpress Link</label>
            <div className='flex gap-2'>
                <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6] w-full' value={importUrl} onChange={(e)=> setImportUrl(e.target.value)} type='text' id='importUrl' placeholder='https://www.aliexpress.com/item/...'/>
                <button type='button' onClick={importHandle} className='bg-green-500 px-4 py-2 rounded-md'>Import</button>
            </div>
        </div>

        {importedProduct && (
        <div className="mb-3">
            <label className="text-[#d0d2d6]">Import Response</label>
            <pre
                className="w-full h-[560px] md:h-[640px] p-3 bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6] font-mono text-sm leading-relaxed whitespace-pre-wrap break-all overflow-auto"
                dangerouslySetInnerHTML={{ __html: formattedImportResponse }}
            />
        </div>
        )}
        <div className='flex flex-col mb-3 w-full text-[#d0d2d6]'>
            <label htmlFor='link'>Product Link</label>
            <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.link} type='text' name='link' id='link' placeholder='https://www.aliexpress.com/item/...'/>
        </div>
        <div className='flex flex-col mb-3 md:flex-row gap-4 w-full text-[#d0d2d6]'>
            <div className='flex flex-col w-full gap-1'>
                <label htmlFor="name">Product Name</label>
                <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.name} type="text" name='name' id='name' placeholder='Product Name' />
            </div>  

            <div className='flex flex-col w-full gap-1'>
                <label htmlFor="brand">Product Brand</label>
                <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.brand} type="text" name='brand' id='brand' placeholder='Brand Name' />
            </div>   

            <div className='flex flex-col w-full gap-1'>
                <label htmlFor='sizes'>Sizes (comma seperated)</label>
                <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.sizes} type='text' name='sizes' id='sizes' placeholder='e.g. small, large'/>
            </div>
        </div>


        <div className='flex flex-col mb-3 md:flex-row gap-4 w-full text-[#d0d2d6]'>
            <div className='flex flex-col w-full gap-1 relative'>
                <label htmlFor="category">Category</label>
                <input readOnly onClick={()=> setCateShow(!cateShow)} className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={category} type="text" id='category' placeholder='--select category--' />

                <div className={`absolute top-[101%] bg-[#475569] w-full transition-all ${cateShow ? 'scale-100' : 'scale-0' } `}>
                    <div className='w-full px-4 py-2 fixed'>
                        <input value={searchValue} onChange={categorySearch} className='px-3 py-1 w-full focus:border-indigo-500 outline-none bg-transparent border border-slate-700 rounded-md text-[#d0d2d6] overflow-hidden' type="text" placeholder='search' /> 
                    </div>
                    <div className='pt-14'></div>
                    <div className='max-h-[220px] overflow-y-auto'>
                    {allCategory.map((c, i) => (
                        <button
                        type="button"
                        key={c._id || c.name || i}
                        className={`block w-full text-left px-4 py-2 
                                    hover:bg-indigo-500 hover:text-white cursor-pointer
                                    ${category === c.name ? 'bg-indigo-500 text-white' : 'text-[#d0d2d6]'}
                                    whitespace-nowrap overflow-hidden text-ellipsis`}
                        onClick={() => {
                            setCateShow(false)
                            setCategory(c.name)
                            setSearchValue('')
                            setAllCategory(categorys || [])
                        }}
                        >
                        {c.name}
                        </button>
                    ))}
                    {allCategory.length === 0 && (
                        <div className='px-4 py-3 text-sm text-slate-300/80'>No results</div>
                    )}
                    </div>


                </div>
            </div>  

            <div className='flex flex-col w-full gap-1'>
                <label htmlFor="stock">Product Stock</label>
                <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.stock} type="number" name='stock' id='stock' placeholder='Stock' />
            </div>   

        </div>


        <div className='flex flex-col mb-3 md:flex-row gap-4 w-full text-[#d0d2d6]'>
            <div className='flex flex-col w-full gap-1'>
                <label htmlFor="price">Price</label>
                <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.price} type="number" name='price' id='price' placeholder='price' />
            </div>  

            <div className='flex flex-col w-full gap-1'>
                <label htmlFor="discount">Discount</label>
                <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.discount} type="number" name='discount' id='discount' placeholder='discount by %' />
            </div>   
            
            <div className='flex flex-col w-full gap-1'>
                <label htmlFor="deliveryTime">Estimated Delivery</label>
                <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.deliveryTime} type="text" name='deliveryTime' id='deliveryTime' placeholder='e.g. 3-5 days' />
            </div>

            <div className='flex flex-col w-full gap-1'>
                <label htmlFor='colorPrices'>Color/Type Option Prices (option:price)</label>
                <textarea
                    rows={4}
                    className='px-4 py-2 h-32 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]'
                    onChange={inputHandle}
                    value={state.colorPrices}
                    name='colorPrices'
                    id='colorPrices'
                    placeholder='20cm With Retail Box: 54.62'
                />
            </div>

        </div>

        <div className='flex flex-col w-full gap-1 mb-5'>
                <label htmlFor="description" className='text-[#d0d2d6]'>Description</label>
                <textarea className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.description} name='description' id='description' placeholder='Description' cols="10" rows="4"></textarea> 
                
            </div> 

            <div className='grid lg:grid-cols-4 grid-cols-1 md:grid-cols-3 sm:grid-cols-2 sm:gap-4 md:gap-4 gap-3 w-full text-[#d0d2d6] mb-4'>
               {
               imageShow.map((img,i) => <div key={i} className='h-[180px] relative'>
                    <label htmlFor={i}>
                        <img className='w-full h-full rounded-sm' src={img.url} alt="" />
                    </label>
                    <input onChange={(e)=> changeImage(e.target.files[0],i) } type="file" id={i} className='hidden'/>
                    <span onClick={()=>removeImage(i)} className='p-2 z-10 cursor-pointer bg-slate-700 hover:shadow-lg hover:shadow-slate-400/50 text-white absolute top-1 right-1 rounded-full'><IoMdCloseCircle /></span>
                </div> )
               }
               
                <label className='flex justify-center items-center flex-col h-[180px] cursor-pointer border border-dashed hover:border-red-500 w-full text-[#d0d2d6]' htmlFor="image">
                    <span><IoMdImages /></span>
                    <span>Select Image </span>
                </label>
                <input className='hidden' onChange={imageHandle} multiple type="file" id='image' />

           </div>

           <div className='grid lg:grid-cols-4 grid-cols-1 md:grid-cols-3 sm:grid-cols-2 sm:gap-4 md:gap-4 gap-3 w-full text-[#d0d2d6] mb-4'>
              {
                colorImageShow.map((img, i) => <div key={i} className='h-[120px] relative'>
                   <label htmlFor={`color-${i}`}>
                       <img className='w-full h-full rounded-sm' src = {img.url} alt = '' />
                   </label>
                   <input onChange={(e)=> changeColorImage(e.target.files[0], i)} type = 'file' id={`color-${i}`} className='hidden'/>
                   <span onClick={()=> removeColorImage(i)} className='p-2 z-10 cursor-pointer bg-slate-700 hover:shadow-lg hover:shadow-slate-400/50 text-white absolute top-1 right-1 rounded-full'><IoMdCloseCircle /></span>
               </div>)
              }

              <label className='flex justify-center items-center flex-col h-[120px] cursor-pointer border border-dashed hover:border-red-500 w-full text-[#d0d2d6]' htmlFor='colorImage'>
                   <span><IoMdImages/></span>
                   <span>Color Image</span>
              </label>
              <input className='hidden' onChange={colorImageHandle} multiple type = 'file' id = 'colorImage'/>
           </div>

            <div className='flex flex-col w-full gap-1 mb-4 text-[#d0d2d6]'>
                <label htmlFor='video'>Product Videos</label>
                <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={videoHandle} multiple type='file' id='video' />
                <div className='mt-2'>
                    {videoNames.map((n,i) => <p key={i}>{n}</p>)}
                </div>
           </div>

            <div className='flex'>
            <button disabled={loader ? true : false}  className='bg-red-500 w-[280px] hover:shadow-red-300/50 hover:shadow-lg text-white rounded-md px-7 py-2 mb-3'>
            {
               loader ? <PropagateLoader color='#fff' cssOverride={overrideStyle} /> : 'Add Product'
            } 
            </button>

            </div>



    </form>
</div>

            </div>
            
        </div>
    );
};

export default AddProduct;