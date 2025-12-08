import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { IoMdImages, IoMdCloseCircle } from "react-icons/io";
import { useDispatch, useSelector } from 'react-redux';
import { get_category } from "../../store/Reducers/categoryReducer"
import { get_product, update_product, messageClear, product_image_update } from '../../store/Reducers/productReducer';
import toast from 'react-hot-toast';
import { PropagateLoader } from 'react-spinners';
import { overrideStyle, parseColorPriceEntries } from './../../utilis/utils';

const EditProduct = () => {
    const { productId } = useParams()

    const dispatch = useDispatch()
    const { categorys } = useSelector(state => state.category)
    const { product, loader, successMessage, errorMessage } = useSelector(state => state.product)

    useEffect(() => {
        dispatch(get_category({
            searchValue: '',
            parPage: '',
            page: ''
        }))
    }, [])

    useEffect(() => {
        dispatch(get_product(productId))
    }, [productId])

    const [state, setState] = useState({
        name: "",
        description: '',
        discount: '',
        price: "",
        brand: "",
        stock: "",
        sizes: '',
        deliveryTime: '',
        colorPrices: '',
        link: '',
        affiliateLink: '',
        productType: 'standard',
        shippingDestination: 'both',
        currency: 'USD'
    })

    const colorPriceEntries = useMemo(
        () => parseColorPriceEntries(state.colorPrices),
        [state.colorPrices]
    );

    const inputHandle = (e) => {
        setState({
            ...state,
            [e.target.name]: e.target.value
        })

    }

    const handleColorEntryChange = (index, field, value) => {
        setState(prev => {
            const entries = parseColorPriceEntries(prev.colorPrices);
            if (!entries[index]) return prev;

            const updatedEntries = entries.map((entry, idx) =>
                idx === index ? { ...entry, [field]: value } : entry
            );

            const normalizedColorPrices = updatedEntries
                .map(({ option = '', price = '' }) => `${option}:${price}`)
                .join(',');

            return {
                ...prev,
                colorPrices: normalizedColorPrices
            };
        });
    };

    const handleAddColorEntry = () => {
        setState(prev => ({
            ...prev,
            colorPrices: prev.colorPrices ? `${prev.colorPrices},:` : ':'
        }));
    };

    const handleRemoveColorEntry = (index) => {
        setState(prev => {
            const entries = parseColorPriceEntries(prev.colorPrices);
            if (!entries[index]) {
                toast.error('Color option not found');
                return prev;
            }
            const filtered = entries.filter((_, idx) => idx !== index);
            const normalizedColorPrices = filtered
                .map(({ option = '', price = '' }) => `${option}:${price}`)
                .join(',');

            toast.success(`Removed color option #${index + 1}`);

            return {
                ...prev,
                colorPrices: normalizedColorPrices
            };
        });
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
    const [imageShow, setImageShow] = useState([])
    const [colorImageShow, setColorImageShow] = useState([])
    const [videoShow, setVideoShow] = useState([])

    const changeImage = (img, files) => {
        if (files.length > 0) {
            if (img) {
                dispatch(product_image_update({
                    oldImage: img,
                    newImage: files[0],
                    productId,
                    imageType: 'product'
                }))
            } else {
                for (let i = 0; i < files.length; i++) {
                    dispatch(product_image_update({
                        oldImage: '',
                        newImage: files[i],
                        productId,
                        imageType: 'product'
                    }))
                }
            }
        }

    }

    const changeColorImage = (img, files) => {
        if (files.length > 0) {
            if (img) {
                dispatch(product_image_update({
                    oldImage: img,
                    newImage: files[0],
                    productId,
                    imageType: 'color'
                }))
            } else {
                for (let i = 0; i < files.length; i++) {
                    dispatch(product_image_update({
                        oldImage: '',
                        newImage: files[i],
                        productId,
                        imageType: 'color'
                    }))
                }
            }
        }
    }

    const changeVideo = (vid, files) => {
        if (files.length > 0) {
            if (vid) {
                dispatch(product_image_update({
                    oldImage: vid,
                    newImage: files[0],
                    productId,
                    imageType: 'video'
                }))
            } else {
                for (let i = 0; i < files.length; i++) {
                    dispatch(product_image_update({
                        oldImage: '',
                        newImage: files[i],
                        productId,
                        imageType: 'video'
                    }))
                }
            }
        }
    }
    const removeMedia = (media, type) => {
        dispatch(product_image_update({
            oldImage: media,
            productId,
            imageType: type,
            action: 'delete'
        }))
    }
    useEffect(() => {
        const shippingDest = product.shippingDestination || 'both';
        let derivedCurrency = 'USD';
        if (shippingDest === 'canada_only') {
            derivedCurrency = 'CAD';
        }

        setState({
            name: product.name,
            description: product.description,
            discount: product.discount,
            price: product.price,
            brand: product.brand,
            stock: product.stock,
            sizes: Array.isArray(product.sizes) ? product.sizes.join(',') : '',
            deliveryTime: product.deliveryTime || '',
            colorPrices: Array.isArray(product.colorPrices) ? product.colors.map((c, i) => `${c}:${product.colorPrices[i] ?? ''}`).join(',') : '',
            link: product.link || '',
            affiliateLink: product.affiliateLink || '',
            productType: product.productType || 'standard',
            shippingDestination: shippingDest,
            currency: derivedCurrency
        })
        setCategory(product.category)
        setImageShow(product.images)
        setColorImageShow(product.colorImages || [])
        setVideoShow(product.videos || [])
    }, [product])

    useEffect(() => {
        if (categorys.length > 0) {
            setAllCategory(categorys)
        }
    }, [categorys])

    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage)
            dispatch(messageClear())
        }
        if (errorMessage) {
            toast.error(errorMessage)
            dispatch(messageClear())
        }
    }, [successMessage, errorMessage])

    const update = (e) => {
        e.preventDefault()

        const colorEntries = parseColorPriceEntries(state.colorPrices);
        if (colorEntries.length !== (colorImageShow ? colorImageShow.length : 0)) {
            toast.error('Number of colors and color images must match')
            return
        }

        if (colorEntries.some(entry => !entry.option)) {
            toast.error('Each color price entry must include a color or type name')
            return
        }

        const normalizedColorPrices = typeof state.colorPrices === 'string'
            ? state.colorPrices
            : Array.isArray(state.colorPrices)
                ? state.colorPrices.join(',')
                : '';

        const obj = {
            name: state.name,
            description: state.description,
            discount: state.discount,
            price: state.price,
            brand: state.brand,
            stock: state.stock,
            colors: colorEntries.map(entry => entry.option).join(','),
            sizes: state.sizes,
            deliveryTime: state.deliveryTime,
            colorPrices: normalizedColorPrices,
            link: state.link,
            affiliateLink: state.affiliateLink,
            productType: state.productType,
            shippingDestination: state.shippingDestination,
            currency: state.currency,
            category: category,
            productId: productId
        }
        dispatch(update_product(obj))
    }

    return (
        <div className='px-2 lg:px-7 pt-5'>
            <div className='w-full p-4 bg-[#6a5fdf] rounded-md'>
                <div className='flex justify-between items-center pb-4'>
                    <h1 className='text-[#d0d2d6] text-xl font-semibold'>Edit Product</h1>
                    <Link to='/admin/dashboard/products' className='bg-blue-500 hover:shadow-blue-500/50 hover:shadow-lg text-white rounded-sm px-7 py-2 my-2'>All Product</Link>
                </div>
                <div>
                    <form onSubmit={update}>
                        <div className='flex flex-col mb-3 w-full text-[#d0d2d6]'>
                            <label htmlFor="name">Product Name</label>
                            <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.name} type="text" name='name' id='name' placeholder='Product Name' />

                            <label htmlFor="productType" className='text-[#d0d2d6] mt-2'>Product Type</label>
                            <select className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.productType} name='productType' id='productType'>
                                <option value="standard">Standard (Dropship)</option>
                                <option value="affiliate">Affiliate (External Link)</option>
                            </select>

                            <label htmlFor="shippingDestination" className='text-[#d0d2d6] mt-2'>Shipping Destination</label>
                            <select className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={(e) => {
                                const dest = e.target.value;
                                let curr = 'USD';
                                if (dest === 'canada_only') curr = 'CAD';
                                setState({ ...state, shippingDestination: dest, currency: curr });
                            }} value={state.shippingDestination} name='shippingDestination' id='shippingDestination'>
                                <option value="both">Both (USD)</option>
                                <option value="canada_only">Canada Only (CAD)</option>
                                <option value="us_only">US Only (USD)</option>
                            </select>

                            <label htmlFor="description" className='text-[#d0d2d6] mt-2'>Description</label>
                            <textarea className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.description} name='description' id='description' placeholder='Description' rows="4"></textarea>
                        </div>
                        <div className='flex flex-col mb-3 w-full text-[#d0d2d6]'>
                            <label htmlFor='link'>Source Link (Admin Only)</label>
                            <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.link} type='text' name='link' id='link' placeholder='https://www.aliexpress.com/item/...' />
                        </div>
                        {state.productType === 'affiliate' && (
                            <div className='flex flex-col mb-3 w-full text-[#d0d2d6]'>
                                <label htmlFor='affiliateLink'>Affiliate Destination Link</label>
                                <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.affiliateLink} type='text' name='affiliateLink' id='affiliateLink' placeholder='https://partner-site.com/product/...' />
                            </div>
                        )}
                        <div className='flex flex-col mb-3 md:flex-row gap-4 w-full text-[#d0d2d6]'>

                            <div className='flex flex-col w-full gap-1'>
                                <label htmlFor="brand">Product Brand</label>
                                <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.brand} type="text" name='brand' id='brand' placeholder='Brand Name' />
                            </div>

                            <div className='flex flex-col w-full gap-1'>
                                <label htmlFor="sizes">Sizes (comma seperated)</label>
                                <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.sizes} type="text" name='sizes' id='sizes' placeholder='e.g. small, large' />
                            </div>
                        </div>


                        <div className='flex flex-col mb-3 md:flex-row gap-4 w-full text-[#d0d2d6]'>
                            <div className='flex flex-col w-full gap-1 relative'>
                                <label htmlFor="category">Category</label>
                                <input readOnly onClick={() => setCateShow(!cateShow)} className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={category} type="text" id='category' placeholder='--select category--' />

                                <div className={`absolute top-[101%] bg-[#475569] w-full transition-all ${cateShow ? 'scale-100' : 'scale-0'} `}>
                                    <div className='w-full px-4 py-2 fixed'>
                                        <input value={searchValue} onChange={categorySearch} className='px-3 py-1 w-full focus:border-indigo-500 outline-none bg-transparent border border-slate-700 rounded-md text-[#d0d2d6] overflow-hidden' type="text" placeholder='search' />
                                    </div>
                                    <div className='pt-14'></div>
                                    <div className='flex justify-start items-start flex-col h-[200px] overflow-x-scrool'>
                                        {
                                            allCategory.length > 0 && allCategory.map((c, i) => <span className={`px-4 py-2 hover:bg-indigo-500 hover:text-white hover:shadow-lg w-full cursor-pointer ${category === c.name && 'bg-indigo-500'}`} onClick={() => {
                                                setCateShow(false)
                                                setCategory(c.name)
                                                setSearchValue('')
                                                setAllCategory(categorys)
                                            }}>{c.name} </span>)
                                        }
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
                                <input className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]' onChange={inputHandle} value={state.colorPrices} type='text' name='colorPrices' id='colorPrices' placeholder='20cm With Retail Box: 54.62' />
                                {
                                    colorPriceEntries.length > 0 && (
                                        <div className='mt-2 flex flex-col gap-3'>
                                            {
                                                colorPriceEntries.map((entry, idx) => (
                                                    <div
                                                        key={`color-price-${idx}`}
                                                        className='rounded-md border border-slate-700 bg-[#5a51c4] px-3 py-3 text-sm shadow-sm'
                                                    >
                                                        <div className='mb-3 flex items-center justify-between gap-2'>
                                                            <div className='flex items-center gap-2'>
                                                                <span className='inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs font-semibold text-white'>{idx + 1}</span>
                                                                <span className='text-xs uppercase tracking-wide text-[#c7c9e2]'>Color / Type Option</span>
                                                            </div>
                                                            <button
                                                                type='button'
                                                                onClick={() => handleRemoveColorEntry(idx)}
                                                                className='text-xs font-semibold uppercase tracking-wide text-red-300 hover:text-red-200'
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>
                                                        <div className='flex flex-col gap-3 sm:flex-row'>
                                                            <div className='flex-1'>
                                                                <label className='mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#d0d2d6]'>Option</label>
                                                                <input
                                                                    className='w-full rounded-md border border-slate-600 bg-[#6a5fdf] px-3 py-2 text-sm text-[#d0d2d6] outline-none focus:border-indigo-300'
                                                                    value={entry.option}
                                                                    onChange={(e) => handleColorEntryChange(idx, 'option', e.target.value)}
                                                                    placeholder='Color name'
                                                                />
                                                            </div>
                                                            <div className='flex-1'>
                                                                <label className='mb-1 block text-[11px] font-semibold uppercase tracking-wide text-[#d0d2d6]'>Price</label>
                                                                <input
                                                                    className='w-full rounded-md border border-slate-600 bg-[#6a5fdf] px-3 py-2 text-sm text-[#d0d2d6] outline-none focus:border-indigo-300'
                                                                    value={entry.price}
                                                                    onChange={(e) => handleColorEntryChange(idx, 'price', e.target.value)}
                                                                    placeholder='Price'
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    )
                                }
                                <button
                                    type='button'
                                    onClick={handleAddColorEntry}
                                    className='mt-3 w-full rounded-md border border-dashed border-indigo-300 py-2 text-sm font-semibold uppercase tracking-wide text-indigo-100 transition hover:border-indigo-200 hover:text-white'
                                >
                                    Add Color Price Entry
                                </button>
                            </div>

                        </div>

                        <div className='grid lg:grid-cols-4 grid-cols-1 md:grid-cols-3 sm:grid-cols-2 sm:gap-4 md:gap-4 gap-3 w-full text-[#d0d2d6] mb-4'>
                            <span>Product Image</span>
                            {
                                imageShow && imageShow.length > 0 && imageShow.map((img, i) => <div key={i} className='relative'>
                                    <span className='absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full'>
                                        {i + 1}
                                    </span>
                                    <label htmlFor={i}>
                                        <img src={img} alt="" />
                                    </label>
                                    <input onChange={(e) => changeImage(img, e.target.files)} type="file" id={i} className='hidden' />
                                    <span onClick={() => removeMedia(img, 'product')} className='absolute top-2 right-2 text-xl cursor-pointer text-red-500'>
                                        <IoMdCloseCircle />
                                    </span>
                                </div>)
                            }
                            <label htmlFor='product-image' className='flex justify-center items-center h-[150px] border border-dashed hover:border-indigo-500 cursor-pointer'>
                                <IoMdImages className='text-5xl' />
                            </label>
                            <input onChange={(e) => changeImage('', e.target.files)} type='file' multiple id='product-image' className='hidden' />

                        </div>

                        <div className='grid lg:grid-cols-4 grid-cols-1 md:grid-cols-3 sm:grid-cols-2 sm:gap-4 md:gap-4 gap-3 w-full text-[#d0d2d6] mb-4'>
                            <span>Color Image</span>
                            {
                                colorImageShow && colorImageShow.length > 0 && colorImageShow.map((img, i) => <div key={i} className='relative'>
                                    <span className='absolute top-2 left-2 bg-black/60 text-white text-xs font-semibold px-2 py-1 rounded-full'>
                                        {i + 1}
                                    </span>
                                    <label htmlFor={`c-${i}`}>
                                        <img src={img} alt='' />
                                    </label>
                                    <input onChange={(e) => changeColorImage(img, e.target.files)} type="file" id={`c-${i}`} className='hidden' />
                                    <span onClick={() => removeMedia(img, 'color')} className='absolute top-2 right-2 text-xl cursor-pointer text-red-500'>
                                        <IoMdCloseCircle />
                                    </span>
                                </div>)
                            }
                            <label htmlFor='color-image' className='flex justify-center items-center h-[150px] border border-dashed hover:border-indigo-500 cursor-pointer'>
                                <IoMdImages className='text-5xl' />
                            </label>
                            <input onChange={(e) => changeColorImage('', e.target.files)} type='file' multiple id='color-image' className='hidden' />

                        </div>

                        <div className='grid lg:grid-cols-4 grid-cols-1 md:grid-cols-3 sm:grid-cols-2 sm:gap-4 md:gap-4 gap-3 w-full text-[#d0d2d6] mb-4'>
                            <span>Product Video</span>
                            {
                                videoShow && videoShow.length > 0 && videoShow.map((vid, i) => <div key={i} className='relative'>
                                    <label htmlFor={`v-${i}`}>
                                        <video src={vid} className='h-[150px]' controls></video>
                                    </label>
                                    <input onChange={(e) => changeVideo(vid, e.target.files)} type='file' id={`v-${i}`} className='hidden' accept='video/*' />
                                    <span onClick={() => removeMedia(vid, 'video')} className='absolute top-2 right-2 text-xl cursor-pointer text-red-500'>
                                        <IoMdCloseCircle />
                                    </span>
                                </div>)
                            }
                            <label htmlFor='product-video' className='flex justify-center items-center h-[150px] border border-dashed hover:border-indigo-500 cursor-pointer'>
                                <IoMdImages className='text-5xl' />
                            </label>
                            <input onChange={(e) => changeVideo('', e.target.files)} type='file' multiple id='product-video' className='hidden' accept='video/*' />
                        </div>

                        <div className='flex'>
                            <button disabled={loader ? true : false} className='bg-red-500 w-[280px] hover:shadow-red-300/50 hover:shadow-lg text-white rounded-md px-7 py-2 mb-3'>
                                {
                                    loader ? <PropagateLoader color='#fff' cssOverride={overrideStyle} /> : 'Save Changes'
                                }
                            </button>

                        </div>



                    </form>
                </div>

            </div>

        </div>
    );
};

export default EditProduct;