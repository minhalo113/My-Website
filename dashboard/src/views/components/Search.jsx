import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const PRICE_INPUT_REGEX = /^\d*(\.\d{0,2})?$/;

const parsePriceValue = (value) => {
    if (value === undefined || value === null) return null;
    if (typeof value === 'number') {
        if (!Number.isFinite(value) || value < 0) return null;
        return value;
    }
    const trimmed = value.trim();
    if (!trimmed || trimmed === '.') return null;
    const parsed = Number(trimmed);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return parsed;
};

const Search = ({
    setParPage,
    setSearchValue,
    searchValue,
    onImageSearch = null,
    imageSearchLoading = false,
    enableImageSearch = false,
    minPrice = null,
    maxPrice = null,
    onPriceChange = null,
    category = '',
    setCategory = null,
    categories = [],
    productType = 'All',
    setProductType = null
}) => {
    const fileInputRef = useRef(null);
    const [localMinPrice, setLocalMinPrice] = useState(minPrice != null ? String(minPrice) : '');
    const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice != null ? String(maxPrice) : '');

    const handleFileChange = (event) => {
        const file = event.target.files && event.target.files[0];
        if (file && onImageSearch) {
            onImageSearch(file);
        }
        event.target.value = '';
    };

    useEffect(() => {
        const parsed = parsePriceValue(minPrice);
        if (parsed != null) {
            setLocalMinPrice(String(parsed));
        } else if (minPrice === null || minPrice === undefined || minPrice === '') {
            setLocalMinPrice('');
        }
    }, [minPrice]);

    useEffect(() => {
        const parsed = parsePriceValue(maxPrice);
        if (parsed != null) {
            setLocalMaxPrice(String(parsed));
        } else if (maxPrice === null || maxPrice === undefined || maxPrice === '') {
            setLocalMaxPrice('');
        }
    }, [maxPrice]);

    const emitPriceChange = useCallback((nextMin, nextMax) => {
        if (!onPriceChange) return;
        const parsedMin = parsePriceValue(nextMin);
        const parsedMax = parsePriceValue(nextMax);
        onPriceChange({ min: parsedMin, max: parsedMax });
    }, [onPriceChange]);

    const handleMinPriceChange = (event) => {
        const value = event.target.value;
        if (value === '' || PRICE_INPUT_REGEX.test(value)) {
            setLocalMinPrice(value);
            emitPriceChange(value, localMaxPrice);
        }
    };

    const handleMaxPriceChange = (event) => {
        const value = event.target.value;
        if (value === '' || PRICE_INPUT_REGEX.test(value)) {
            setLocalMaxPrice(value);
            emitPriceChange(localMinPrice, value);
        }
    };

    const handleClearPrices = () => {
        setLocalMinPrice('');
        setLocalMaxPrice('');
        emitPriceChange('', '');
    };

    return (
        <div className='flex flex-col gap-3'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-3'>
                    <select
                        onChange={(e) => setParPage(parseInt(e.target.value))}
                        className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]'
                    >
                        <option value='5'>5</option>
                        <option value='10'>10</option>
                        <option value='20'>20</option>
                    </select>
                    {enableImageSearch && (
                        <>
                            <input
                                ref={fileInputRef}
                                type='file'
                                accept='image/*'
                                className='hidden'
                                onChange={handleFileChange}
                            />
                            <button
                                type='button'
                                onClick={() => fileInputRef.current?.click()}
                                disabled={imageSearchLoading}
                                className='px-4 py-2 rounded-md bg-[#4f46c5] text-white text-sm font-medium hover:bg-[#443ab8] transition disabled:opacity-70 disabled:cursor-not-allowed'
                                title='Search catalog by image'
                            >
                                {imageSearchLoading ? 'Searching…' : 'Search by Image'}
                            </button>
                        </>
                    )}
                </div>
                <input
                    onChange={(e) => setSearchValue(e.target.value)}
                    value={searchValue}
                    className='px-4 py-2 focus:border-indigo-500 outline-none bg-[#6a5fdf] border border-slate-700 rounded-md text-[#d0d2d6]'
                    type='text'
                    placeholder='Search products'
                />
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                {/* Category Filter */}
                {setCategory && (
                    <div className='flex flex-col gap-1'>
                        <label htmlFor='dash-category-filter' className='text-xs font-medium text-[#d0d2d6]'>Category</label>
                        <select
                            id='dash-category-filter'
                            onChange={(e) => setCategory(e.target.value)}
                            value={category}
                            className='px-3 py-2 rounded-md bg-[#6a5fdf] border border-slate-700 text-[#d0d2d6] focus:border-indigo-400 outline-none'
                        >
                            <option value=''>All Categories</option>
                            {categories.map((c, i) => <option key={i} value={c}>{c}</option>)}
                        </select>
                    </div>
                )}

                {/* Product Type Filter */}
                {setProductType && (
                    <div className='flex flex-col gap-1'>
                        <label htmlFor='dash-product-type-filter' className='text-xs font-medium text-[#d0d2d6]'>Product Type</label>
                        <select
                            id='dash-product-type-filter'
                            onChange={(e) => setProductType(e.target.value)}
                            value={productType}
                            className='px-3 py-2 rounded-md bg-[#6a5fdf] border border-slate-700 text-[#d0d2d6] focus:border-indigo-400 outline-none'
                        >
                            <option value='All'>All</option>
                            <option value='standard'>Standard</option>
                            <option value='affiliate'>Affiliate</option>
                        </select>
                    </div>
                )}
            </div>

            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                <div className='flex flex-col gap-1'>
                    <label htmlFor='dash-min-price' className='text-xs font-medium text-[#d0d2d6]'>Min price</label>
                    <input
                        id='dash-min-price'
                        type='text'
                        inputMode='decimal'
                        value={localMinPrice}
                        onChange={handleMinPriceChange}
                        placeholder='0.00'
                        className='px-3 py-2 rounded-md bg-[#6a5fdf] border border-slate-700 text-[#d0d2d6] focus:border-indigo-400 outline-none'
                    />
                </div>
                <div className='flex flex-col gap-1'>
                    <label htmlFor='dash-max-price' className='text-xs font-medium text-[#d0d2d6]'>Max price</label>
                    <input
                        id='dash-max-price'
                        type='text'
                        inputMode='decimal'
                        value={localMaxPrice}
                        onChange={handleMaxPriceChange}
                        placeholder='0.00'
                        className='px-3 py-2 rounded-md bg-[#6a5fdf] border border-slate-700 text-[#d0d2d6] focus:border-indigo-400 outline-none'
                    />
                </div>
            </div>
            <div className='flex items-center justify-between text-xs text-[#d0d2d6]'>
                <span>Filter results by price range.</span>
                <button
                    type='button'
                    onClick={handleClearPrices}
                    className='text-indigo-200 hover:text-white disabled:opacity-60'
                    disabled={!localMinPrice && !localMaxPrice}
                >
                    Clear price filters
                </button>
            </div>
        </div>
    );
};

Search.propTypes = {
    setParPage: PropTypes.func.isRequired,
    setSearchValue: PropTypes.func.isRequired,
    searchValue: PropTypes.string.isRequired,
    onImageSearch: PropTypes.func,
    imageSearchLoading: PropTypes.bool,
    enableImageSearch: PropTypes.bool,
    minPrice: PropTypes.number,
    maxPrice: PropTypes.number,
    onPriceChange: PropTypes.func,
    category: PropTypes.string,
    setCategory: PropTypes.func,
    categories: PropTypes.array,
    productType: PropTypes.string,
    setProductType: PropTypes.func,
};

export default Search;
