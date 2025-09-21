import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import PropTypes from 'prop-types';
import api from '../../src/api/api';

const Search = ({products}) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [imageResults, setImageResults] = useState([]);
    const [imageSearchMessage, setImageSearchMessage] = useState('');
    const [imageSearchLoading, setImageSearchLoading] = useState(false);
    const [imageSearchError, setImageSearchError] = useState('');

    const [showDropdown, setShowDropdown] = useState(true)
    const dropdownRef = useRef(null)
    const fileInputRef = useRef(null);

    const filteredProducts = (products || []).filter((product) => {
        return product.name.toLowerCase().includes(searchTerm.toLowerCase());
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

    const handleImageSearch = async (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        setImageSearchLoading(true);
        setImageSearchMessage('');
        setImageSearchError('');

        try {
            const formData = new FormData();
            formData.append('image', file);
            const { data } = await api.post('/customers-product-image-search', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const matches = data?.matches || [];
            setImageResults(matches);
            if (matches.length) {
                const total = data?.totalMatches || matches.length;
                const raw = data?.rawMatchCount;
                const suffix = raw && raw > total ? ` across ${raw} image hit${raw === 1 ? '' : 's'}` : '';
                setImageSearchMessage(`Found ${matches.length} matching product${matches.length > 1 ? 's' : ''}${total > matches.length ? ` (top ${matches.length} of ${total})` : ''}${suffix}.`);
            } else {
                setImageSearchMessage('No matching products found for that image.');
            }
        } catch (error) {
            setImageResults([]);
            setImageSearchError(error?.response?.data?.error || 'Unable to search by image right now.');
        } finally {
            setImageSearchLoading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

  return (
    <div className='widget widget-search'>
        <div className='search-wrapper mb-3' ref={dropdownRef}>
            <div className='d-flex gap-2 align-items-center'>
                <input type='text' name= "search" id = "search" placeholder='Search...' value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)} className='flex-grow-1'/>
                <button type='button' className='btn btn-outline-secondary' onClick={() => fileInputRef.current?.click()} disabled={imageSearchLoading}>
                    {imageSearchLoading ? 'Searching…' : 'Image'}
                </button>
                <button type='submit' className='btn btn-primary' onClick={(e) => e.preventDefault()}>
                    <i className='icofont-search-2'></i>
                </button>
            </div>
            <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                className='d-none'
                onChange={handleImageSearch}
            />
        </div>

        {(imageSearchLoading || imageSearchMessage || imageSearchError || imageResults.length > 0) && (
            <div className='mb-3'>
                {imageSearchMessage && <p className='text-success small mb-2'>{imageSearchMessage}</p>}
                {imageSearchError && <p className='text-danger small mb-2'>{imageSearchError}</p>}
                {imageSearchLoading && <p className='small text-muted mb-2'>Analyzing image…</p>}
                <div className='d-flex flex-column gap-2'>
                    {imageResults.map((match) => (
                        <Link key={match.productId} href={`/shop/${match.productId}`}>
                            <div className='border rounded p-2 d-flex gap-3 align-items-center text-decoration-none'>
                                <img src={match.imageUrl} alt={match.productName} className='rounded' style={{ width: '64px', height: '64px', objectFit: 'cover' }} />
                                <div className='flex-grow-1'>
                                    <p className='mb-1 fw-semibold text-dark'>{match.productName}</p>
                                    <p className='mb-1 text-muted small'>
                                        {match.matchType === 'color' ? 'Variant match' : 'Primary image'}
                                        {match.colorLabel ? ` · ${match.colorLabel}` : ''}
                                        {match.similarity != null ? ` · ${match.similarity}% similar` : ''}
                                    </p>
                                    {match.similarOptions?.length ? (
                                        <p className='mb-0 text-muted small'>Similar options: {match.similarOptions.join(', ')}</p>
                                    ) : null}
                                </div>
                                <span className='text-primary fw-semibold'>View</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        )}

        <div  style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: "400px", overflowY :"auto"}}>
            {
                searchTerm && showDropdown && filteredProducts.slice(0, 20).map((product) => {
                    const hasVariant = product.colors && product.colors.length > 0 && Array.isArray(product.colorPrices) && product.colorPrices.length > 0;
                    let variantRange = null;
                    if(hasVariant){
                        const prices = product.colors.map((c, idx) => product.colorPrices[idx]).filter(v=>v!==undefined);
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        variantRange = {
                            minBase: min.toFixed(2),
                            maxBase: max.toFixed(2)
                        };
                    }
                    return(
                    <Link key = {product._id.toString()} href = {`/shop/${product._id.toString()}`}>
                        <div className='d-flex gap-3 p-2'>
                            <div>
                                <div className='pro-thumb h-25'>
                                    <img src = {product.images[0]} alt = "" className='flex-{grow|shrink}-0'/>
                                </div>
                            </div>

                            <div className='product-content'>
                                <p>
                                    <Link href = {`/shop/${product._id.toString()}`}>
                                    {product.name}
                                    </Link>
                                </p>
                                <h6>
                                    {hasVariant ? (variantRange.minBase === variantRange.maxBase ? `$${variantRange.minBase}` : `$${variantRange.minBase} - $${variantRange.maxBase}`) : `$${product.price}`}
                                </h6>
                            </div>
                        </div>
                    </Link>
                    )
                })
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