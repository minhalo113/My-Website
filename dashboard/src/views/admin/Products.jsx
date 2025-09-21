import React, {useEffect, useState } from 'react'; 
import Search from '../components/Search';
import { Link } from 'react-router-dom';
import Pagination from '../Pagination'; 
import { FaEdit, FaEye, FaEyeSlash, FaTrash } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { get_products, deleteProduct, product_visibility, messageClear, search_product_by_image } from '../../store/Reducers/productReducer';
import toast from 'react-hot-toast';

const Products = () => {

    const dispatch = useDispatch()
        const {
        products,
        totalProduct,
        successMessage,
        errorMessage,
        imageSearchResults,
        imageSearchLoading,
        imageSearchMeta,
        imageSearchMessage,
    } = useSelector(state => state.product)
    console.log(products)
 
    const [currentPage, setCurrentPage] = useState(1)
    const [searchValue, setSearchValue] = useState('')
    const [parPage, setParPage] = useState(5)

    useEffect(() => {
        const obj = {
            parPage: parseInt(parPage),
            page: parseInt(currentPage),
            searchValue
        }
        dispatch(get_products(obj))
    }, [searchValue, currentPage, parPage])

    const truncateText = (text, maxLength)=>{
        if (!text || text.length < maxLength) return text;
        return text.slice(0, maxLength) + '...'
    }

    const handleDelete = (id) => {
        if (window.confirm("Are you sure to delete this product?")) {
            dispatch(deleteProduct(id))
        }
    }

    const handleVisibility = (id, isHidden) => {
        dispatch(product_visibility({productId: id, isHidden}))
    }

    const handleImageSearch = (file) => {
        if (!file) return;
        dispatch(search_product_by_image({ imageFile: file }));
    };

    useEffect(() => {
        if (successMessage) {
            toast.success(successMessage)
            dispatch(messageClear())
        }
        if(errorMessage){
            toast.error(errorMessage)
            dispatch(messageClear())
        }
    }, [successMessage,errorMessage, dispatch])

    useEffect(() => {
        if(imageSearchMessage){
            const hasMatches = (imageSearchMeta?.returnedMatches || 0) > 0;
            if(hasMatches){
                toast.success(imageSearchMessage)
            }else{
                toast(imageSearchMessage)
            }
            dispatch(messageClear())
        }
    }, [imageSearchMessage, imageSearchMeta, dispatch])

    return (
        <div className='px-2 lg:px-7 pt-5'>
            <h1 className='text-[#000000] font-semibold text-lg mb-3'>All Products</h1>

         <div className='w-full p-4 bg-[#6a5fdf] rounded-md'> 
        <Search
            setParPage={setParPage}
            setSearchValue={setSearchValue}
            searchValue={searchValue}
            onImageSearch={handleImageSearch}
            imageSearchLoading={imageSearchLoading}
            enableImageSearch
         />

        {(imageSearchLoading || (imageSearchResults && imageSearchResults.length > 0)) && (
            <div className='mt-5 bg-[#5f55df] border border-slate-600/60 rounded-md p-4 text-[#d0d2d6]'>
                <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-4'>
                    <div>
                        <h2 className='text-base font-semibold text-white'>Image Search Results</h2>
                        {imageSearchMeta && (
                            <p className='text-xs text-slate-200 mt-1'>
                                Showing {imageSearchMeta.returnedMatches || 0}
                                {imageSearchMeta.totalMatches ? ` of ${imageSearchMeta.totalMatches}` : ''} product match
                                {imageSearchMeta.rawMatchCount ? ` (${imageSearchMeta.rawMatchCount} image hit${imageSearchMeta.rawMatchCount === 1 ? '' : 's'})` : ''}.
                            </p>
                        )}
                    </div>
                </div>
                {imageSearchLoading ? (
                    <p className='text-sm text-slate-200'>Analyzing image…</p>
                ) : (
                    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                        {imageSearchResults.map((match) => (
                            <div key={match.productId} className='bg-[#4f46c5] border border-indigo-400/40 rounded-md p-4 flex flex-col gap-3'>
                                <div className='flex items-start gap-3'>
                                    <img
                                        src={match.imageUrl}
                                        alt={match.productName}
                                        className='w-20 h-20 object-cover rounded-md border border-white/20'
                                    />
                                    <div className='flex-1'>
                                        <p className='text-sm font-semibold text-white'>{match.productName}</p>
                                        <p className='text-xs text-indigo-100/80'>Match: {match.matchType === 'color' ? 'Variant image' : 'Primary image'}{match.colorLabel ? ` (${match.colorLabel})` : ''}</p>
                                        <p className='text-xs text-indigo-100/80'>Similarity: {match.similarity != null ? `${match.similarity}% (distance ${match.distance})` : '—'}</p>
                                        {match.similarOptions?.length ? (
                                            <div className='mt-2 flex flex-wrap gap-2'>
                                                {match.similarOptions.map((option) => (
                                                    <span key={option} className='px-2 py-1 text-[11px] bg-indigo-600/60 rounded-full'>
                                                        {option}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div className='flex items-center justify-between text-xs text-indigo-100/80'>
                                    <span>Total matches: {match.matches?.length || 0}</span>
                                    <span>Primary: {match.primaryMatches?.length || 0}</span>
                                    <span>Variants: {match.variantMatches?.length || 0}</span>
                                </div>
                                <div className='flex items-center justify-between text-xs text-indigo-100/80'>
                                    <span>Stock: {match.stock ?? '—'}</span>
                                    <span>Price: {match.price != null ? `$${Number(match.price).toFixed(2)}` : '—'}</span>
                                </div>
                                <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2'>
                                    <Link
                                        to={`/admin/dashboard/edit-product/${match.productId}`}
                                        className='flex-1 text-center text-xs font-semibold text-white bg-[#342c9c] hover:bg-[#2b2584] px-3 py-2 rounded-md'
                                    >
                                        Review Product
                                    </Link>
                                    {match.link && (
                                        <a
                                            href={match.link}
                                            target='_blank'
                                            rel='noreferrer'
                                            className='flex-1 text-center text-xs text-white underline'
                                        >
                                            View Listing
                                        </a>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}


         <div className='relative overflow-x-auto mt-5'>
            <table className='w-full text-sm text-left text-[#d0d2d6]'>
                <thead className='text-sm text-[#d0d2d6] uppercase border-b border-slate-700'>
                    <tr>
                        <th scope='col' className='py-3 px-4'>No</th>
                        <th scope='col' className='py-3 px-4'>Image</th>
                        <th scope='col' className='py-3 px-4'>Name</th>
                        <th scope='col' className='py-3 px-4'>Category</th>
                        <th scope='col' className='py-3 px-4'>Brand</th>
                        <th scope='col' className='py-3 px-4'>Price</th>
                        <th scope='col' className='py-3 px-4'>Discount</th>
                        <th scope='col' className='py-3 px-4'>Stock</th>
                        <th scope='col' className='py-3 px-4'>Description</th>
                        <th scope='col' className='py-3 px-4'>Link</th>
                        <th scope='col' className='py-3 px-4'>Action</th> 
                    </tr>
                </thead>

                <tbody>
                    {
                        (products || []).map((d, i) => <tr key={i}>
                            <td scope='row' className='py-1 px-4 font-medium whitespace-nowrap'>{i + 1}</td>
                            <td scope='row' className='py-1 px-4 font-medium whitespace-nowrap'>
                                <img className='w-[45px] h-[45px]' src={d.images[0]} alt="" />
                            </td>
                            
                            <td scope='row' className='py-1 px-4 font-medium whitespace-nowrap'>{truncateText(d.name, 15)}</td>
                            <td scope = "row" className = "py-1 px-4 font-medium whitespace-nowrap">{d.category}</td>
                            <td scope = "row" className = "py-1 px-4 font-medium whitespace-nowrap">{d.brand}</td>
                            <td scope = "row" className = "py-1 px-4 font-medium whitespace-nowrap">{d.price}</td>
                            <td scope = "row" className = "py-1 px-4 font-medium whitespace-nowrap">{
                                    d.discount === 0? <span>No Discount</span> :
                                    <span>%{d.discount}</span>
                                }
                            </td>
                            <td scope = "row" className = "py-1 px-4 font-medium whitespace-nowrap">{d.stock}</td>
                            <td scope = "row" className = "py-1 px-4 font-medium whitespace-nowrap">{truncateText(d.description, 150)}</td>
                             <td scope = "row" className = "py-1 px-4 font-medium whitespace-nowrap">
                                {d.link ? <a href={d.link} target='_blank' rel='noreferrer' className='text-blue-400 underline break-all'>{truncateText(d.link,30)}</a> : 'N/A'}
                            </td>
                            <td scope='row' className='py-1 px-4 font-medium whitespace-nowrap'>
                            <div className='flex justify-start items-center gap-4'>
                                {
                                    d.isHidden ?
                                    <button className='p-[6px] bg-green-500 rounded hover:shadow-lg hover:shadow-green-500/50' onClick={() => handleVisibility(d._id, false)}><FaEye/></button>
                                    :
                                    <button className='p-[6px] bg-blue-500 rounded hover:shadow-lg hover:shadow-blue-500/50' onClick={() => handleVisibility(d._id, true)}><FaEyeSlash/></button>
                                }
                                <Link to={`/admin/dashboard/edit-product/${d._id}`} className='p-[6px] bg-yellow-500 rounded hover:shadow-lg hover:shadow-yellow-500/50'> <FaEdit/> </Link>
                                <Link className='p-[6px] bg-red-500 rounded hover:shadow-lg hover:shadow-red-500/50' onClick={() => handleDelete(d._id)}> <FaTrash/> </Link>
                            </div>
                        </td>
                    </tr> )
                    }

                    
                </tbody> 
            </table> 
        </div>  

        {
            totalProduct <= parPage ? "": <div className='w-full flex justify-end mt-4 bottom-4 right-4'>
                <Pagination
                    pageNumber={currentPage}
                    setPageNumber={setCurrentPage}
                    totalItem={totalProduct}
                    parPage={parPage}
                />
            </div>
        }  
        </div>
    </div>
    );
};

export default Products;