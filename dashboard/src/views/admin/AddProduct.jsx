import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { IoMdImages } from "react-icons/io";
import { IoMdCloseCircle } from "react-icons/io";
import { useDispatch, useSelector } from 'react-redux';
import { get_category } from '../../store/Reducers/categoryReducer';
import { add_product, messageClear, import_aliexpress_product, check_product_images_for_duplicates } from '../../store/Reducers/productReducer';
import { PropagateLoader } from 'react-spinners';
import { overrideStyle, extractColors } from '../../utilis/utils';
import toast from 'react-hot-toast';
import JSZip from 'jszip';

const AddProduct = () => {
    const dispatch = useDispatch()
    const { categorys } = useSelector(state => state.category)

    const {
        loader,
        successMessage,
        errorMessage,
        importedProduct,
        preflightCheckLoading,
        preflightCheckResults,
        preflightCheckMessage,
        preflightCheckThreshold,
        preflightCheckMatches,
    } = useSelector(state => state.product)
    
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

    const parseImportImages = (product) => {
        const entries = [];
        if (Array.isArray(product?.summaryImageLine)) {
            const digits = String(product.summaryImageLine.length).length;
            product.summaryImageLine.forEach((line, idx) => {
                const [name, url] = line.split(/:\s+/);
                if (name && url) {
                    const numbered = `(${String(idx + 1).padStart(digits, '0')}) ${name}`;
                    entries.push({ name: numbered, url });
                }
            });
        }
        if (Array.isArray(product?.image_urls)) {
            product.image_urls.forEach((url, index) => {
                entries.push({ name: `images(${index + 1})`, url });
            });
        }
        return entries;
    };

    const hasImportImages = useMemo(() => {
        if (!importedProduct) return false;
        return parseImportImages(importedProduct).length > 0;
    }, [importedProduct]);

    const sanitizeFileName = (name) => name.replace(/[<>:"/\\|?*]+/g, '');

    const handleDownloadImages = async () => {
        if (!importedProduct) return;
        const entries = parseImportImages(importedProduct);
        const zip = new JSZip();

        await Promise.all(
            entries.map(async ({ name, url }) => {
                const response = await fetch(url);
                const blob = await response.blob();
                const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
                const ext = match ? match[1] : 'jpg';
                zip.file(`${sanitizeFileName(name)}.${ext}`, blob);
            })
        );

        const content = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.setAttribute('download', 'images.zip');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImageDuplicateCheck = () => {
        if (images.length === 0 && colorImages.length === 0) {
            toast.error('Please upload images before running the duplicate check');
            return;
        }
        const formData = new FormData();
        images.forEach((file) => formData.append('images', file));
        colorImages.forEach((file) => formData.append('colorImages', file));
        dispatch(check_product_images_for_duplicates(formData));
    };
    
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
            <label htmlFor="name">Product Name</label>
            <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.name} type="text" name='name' id='name' placeholder='Product Name' />
            <label htmlFor="description" className='text-[#d0d2d6] mt-2'>Description</label>
            <textarea className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.description} name='description' id='description' placeholder='Description' rows="4"></textarea>
        </div>
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
            {hasImportImages && (
                <div className="my-2">
                    <button type="button" onClick={handleDownloadImages} className="bg-blue-500 text-white px-4 py-2 rounded-md">Download Images</button>
                </div>
            )}
            <pre
                className="w-full h-[560px] md:h-[640px] p-3 bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6] font-mono text-sm leading-relaxed whitespace-pre-wrap break-all overflow-auto"
                dangerouslySetInnerHTML={{ __html: formattedImportResponse }}
            />
        </div>
        )}
            
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

            <div className='mb-6 text-[#d0d2d6]'>
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-3'>
                    <button
                        type='button'
                        onClick={handleImageDuplicateCheck}
                        disabled={preflightCheckLoading || (images.length === 0 && colorImages.length === 0)}
                        className={`px-4 py-2 rounded-md w-full lg:w-auto transition-colors ${
                            preflightCheckLoading || (images.length === 0 && colorImages.length === 0)
                                ? 'bg-slate-600 cursor-not-allowed text-slate-300'
                                : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                        }`}
                    >
                        {preflightCheckLoading ? 'Checking images...' : 'Check for Existing Images'}
                    </button>
                    {preflightCheckMessage && (
                        <p className='text-sm text-slate-200/90'>{preflightCheckMessage}</p>
                    )}
                    {preflightCheckMatches > 0 && (
                        <span className='text-xs text-indigo-200 bg-indigo-600/30 border border-indigo-400/40 px-2 py-1 rounded-full'>
                            Threshold {preflightCheckThreshold}
                        </span>
                    )}
                </div>

                {preflightCheckResults.length > 0 && (
                    <div className='space-y-4'>
                        {preflightCheckResults.map((result, idx) => {
                            const previewUrl =
                                result.sourceType === 'color'
                                    ? colorImageShow[result.sourceIndex]?.url
                                    : imageShow[result.sourceIndex]?.url;
                            const key = `${result.sourceType}-${result.sourceIndex}-${idx}`;
                            return (
                                <div key={key} className='bg-[#5a51df] border border-slate-600/70 rounded-md p-4 shadow-sm'>
                                    <div className='flex flex-col lg:flex-row gap-4'>
                                        <div className='flex flex-col items-start gap-2 w-full lg:w-44'>
                                            <span className='text-xs uppercase tracking-wide bg-indigo-600/40 border border-indigo-400/50 px-2 py-1 rounded-full'>
                                                {result.sourceType === 'color' ? 'Variant Image' : 'Primary Image'}
                                            </span>
                                            <p className='text-sm text-slate-200/80 break-all'>{result.filename}</p>
                                            {previewUrl && (
                                                <img
                                                    src={previewUrl}
                                                    alt={result.filename || 'preview'}
                                                    className='w-full lg:w-40 h-40 object-cover rounded-md border border-slate-500/70'
                                                />
                                            )}
                                        </div>
                                        <div className='flex-1 space-y-3'>
                                            {result.error && (
                                                <p className='text-sm text-red-200 bg-red-500/20 border border-red-400/40 px-3 py-2 rounded-md'>
                                                    {result.error}
                                                </p>
                                            )}
                                            {!result.error && result.matches.length === 0 && (
                                                <p className='text-sm text-slate-200/80 bg-slate-700/40 border border-slate-500/60 px-3 py-2 rounded-md'>
                                                    No similar product images were found for this upload.
                                                </p>
                                            )}
                                            {result.matches.length > 0 && (
                                                <div className='space-y-3'>
                                                    <p className='text-sm text-slate-100'>
                                                        Potential matches ({result.matches.length}{result.totalMatches > result.matches.length ? ` of ${result.totalMatches}` : ''})
                                                    </p>
                                                    <ul className='space-y-3 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar'>
                                                        {result.matches.map((match, matchIdx) => (
                                                            <li
                                                                key={`${match.productId}-${matchIdx}`}
                                                                className='bg-[#4c44c7] border border-indigo-400/40 rounded-md p-3 text-sm text-slate-100'
                                                            >
                                                                <div className='flex gap-3'>
                                                                    <img
                                                                        src={match.imageUrl}
                                                                        alt={match.productName}
                                                                        className='w-20 h-20 object-cover rounded-md border border-slate-600/70 flex-shrink-0'
                                                                    />
                                                                    <div className='flex-1 space-y-1'>
                                                                        <p className='font-semibold text-white leading-snug'>
                                                                            {match.productName}
                                                                        </p>
                                                                        <p className='text-xs text-slate-200/80'>
                                                                            Similarity: {match.similarity}% (distance {match.distance})
                                                                        </p>
                                                                        {match.similarOptions?.length ? (
                                                                            <p className='text-xs text-slate-200/70'>
                                                                                Similar options: {match.similarOptions.join(', ')}
                                                                            </p>
                                                                        ) : null}
                                                                        {match.category && (
                                                                            <p className='text-xs text-slate-200/70'>Category: {match.category}</p>
                                                                        )}
                                                                        {match.shopName && (
                                                                            <p className='text-xs text-slate-200/70'>Shop: {match.shopName}</p>
                                                                        )}
                                                                        {match.link && (
                                                                            <a
                                                                                href={match.link}
                                                                                target='_blank'
                                                                                rel='noopener noreferrer'
                                                                                className='inline-flex text-xs text-indigo-200 underline hover:text-indigo-100'
                                                                            >
                                                                                View source link
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className='flex flex-col w-full gap-1 mb-4 text-[#d0d2d6]'>
                <label htmlFor='video'>Product Videos</label>
                <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={videoHandle} multiple type='file' id='video' />
                <div className='mt-2'>
                    {videoNames.map((n,i) => <p key={i}>{n}</p>)}
                </div>
           </div>
        <div className='flex flex-col mb-3 w-full text-[#d0d2d6]'>
            <label htmlFor='link'>Product Link</label>
            <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.link} type='text' name='link' id='link' placeholder='https://www.aliexpress.com/item/...'/>
        </div>
        <div className='flex flex-col mb-3 md:flex-row gap-4 w-full text-[#d0d2d6]'>
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