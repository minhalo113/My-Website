import React from 'react'
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import PropTypes from 'prop-types';
import api from '../../src/api/api';

const DEFAULT_THRESHOLD = 64;

const Search = ({products}) => {
    const [searchTerm, setSearchTerm] = useState("");

    const [showDropdown, setShowDropdown] = useState(true)
    const dropdownRef = useRef(null)

    const [imageFile, setImageFile] = useState(null);
    const [imageMatches, setImageMatches] = useState([]);
    const [isImageSearching, setIsImageSearching] = useState(false);
    const [imageSearchError, setImageSearchError] = useState('');
    const [imageThreshold, setImageThreshold] = useState(DEFAULT_THRESHOLD);
    const [queryPreview, setQueryPreview] = useState(null);

    const filteredProducts = (products || []).filter((product) => {
        return product.name.toLowerCase().includes(searchTerm.toLowerCase());
    });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!dropdownRef.current) return;

            if (dropdownRef.current.contains(event.target)) {
                setShowDropdown(true);
                return;
            }

            setShowDropdown(false);
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, []);

    useEffect(() => {
        if (!queryPreview) return undefined;
        return () => {
            URL.revokeObjectURL(queryPreview);
        };
    }, [queryPreview]);

    useEffect(() => {
        if (!imageFile) return undefined;

        setShowDropdown(true);
        setImageMatches([]);
        setImageSearchError('');
        setIsImageSearching(true);

        let ignore = false;

        (async () => {
            try {
                const formData = new FormData();
                formData.append('image', imageFile);
                formData.append('threshold', imageThreshold);

                const { data } = await api.post('/customers-product-image-search', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });

                if (ignore) return;

                const matches = Array.isArray(data?.matches) ? data.matches : [];
                setImageMatches(matches);
            } catch (error) {
                if (ignore) return;
                const message = error?.response?.data?.error || 'Failed to search with the selected image.';
                setImageSearchError(message);
            } finally {
                if (!ignore) {
                    setIsImageSearching(false);
                }
            }
        })();

        return () => {
            ignore = true;
        };
    }, [imageFile, imageThreshold]);

    const resetPreview = () => {
        setQueryPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setImageFile(null);
        setImageMatches([]);
        setImageSearchError('');
        setIsImageSearching(false);
        setImageThreshold(DEFAULT_THRESHOLD);
        resetPreview();
        setShowDropdown(true);
    };

    const handleImageChange = (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setImageSearchError('Please choose a valid image file.');
            event.target.value = '';
            return;
        }

        setSearchTerm('');
        setImageMatches([]);
        setImageSearchError('');
        setImageThreshold(DEFAULT_THRESHOLD);
        setIsImageSearching(true);
        setShowDropdown(true);

        const previewUrl = URL.createObjectURL(file);
        setQueryPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return previewUrl;
        });
        setImageFile(file);

        event.target.value = '';
    };

    const clearImageSearch = () => {
        setImageFile(null);
        setImageMatches([]);
        setImageSearchError('');
        setIsImageSearching(false);
        setImageThreshold(DEFAULT_THRESHOLD);
        resetPreview();
        setShowDropdown(false);
    };

    const formatPriceDisplay = (price, discount) => {
        const base = Number(price);
        if (!Number.isFinite(base)) return null;
        const roundedBase = base.toFixed(2);
        const numericDiscount = Number(discount);
        if (Number.isFinite(numericDiscount) && numericDiscount > 0) {
            const discounted = (base - (base * numericDiscount) / 100).toFixed(2);
            return (
                <>
                    ${discounted}
                    <del className='text-xs text-muted ms-2'>${roundedBase}</del>
                </>
            );
        }
        return `$${roundedBase}`;
    };

    const showTextResults = Boolean(searchTerm && showDropdown);
    const showImageResults = Boolean(!searchTerm && showDropdown && (imageMatches.length > 0 || imageSearchError || isImageSearching || queryPreview));

    const getMatchPreview = (match) => {
        if (!match || typeof match !== 'object') {
            return { previewUrl: null, previewAlt: 'Matched product', bestMatch: null };
        }

        const bestMatch = match.bestMatch || match;

        const previewUrl =
            bestMatch?.imageUrl ||
            match.imageUrl ||
            (Array.isArray(match.variantMatches) && match.variantMatches[0]?.imageUrl) ||
            (Array.isArray(match.primaryMatches) && match.primaryMatches[0]?.imageUrl) ||
            null;

        const optionLabel = bestMatch?.colorLabel || match.colorLabel;
        const previewAlt =
            bestMatch?.matchType === 'color'
                ? `${match.productName || 'Matched product'}${optionLabel ? ` - ${optionLabel}` : ''}`
                : match.productName || 'Matched product';

        return { previewUrl, previewAlt, bestMatch };
    };

  return (
    <div className='widget widget-search' ref={dropdownRef}>
        <form className='search-wrapper mb-3' onSubmit={(e) => e.preventDefault()}>
            <input type='text' name= "search" id = "search" placeholder='Search...'
            value={searchTerm}
            onChange={handleSearchChange}/>

            <button type='submit'>
                <i className='icofont-search-2'></i>
            </button>
        </form>

        <div className='mb-3 p-3 border rounded' style={{ background: '#f8f9fa' }}>
            <label htmlFor='image-search-input' className='d-block fw-semibold mb-2'>Search with an image</label>
            <input
                id='image-search-input'
                type='file'
                accept='image/*'
                className='form-control form-control-sm'
                onChange={handleImageChange}
            />
            <p className='small text-muted mt-2 mb-0'>Upload a product photo to discover similar items.</p>

            {queryPreview && (
                <div className='d-flex align-items-center gap-3 mt-3'>
                    <img
                        src={queryPreview}
                        alt='Selected reference'
                        style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #dee2e6' }}
                    />
                    <div className='flex-grow-1'>
                        {/* <label htmlFor='image-threshold' className='form-label small text-muted mb-1'>Similarity threshold ({imageThreshold})</label>
                        <input
                            id='image-threshold'
                            type='range'
                            min='0'
                            max='64'
                            value={imageThreshold}
                            className='form-range'
                            onChange={(e) => setImageThreshold(Number(e.target.value))}
                        /> */}
                        {/* <div className='d-flex justify-content-between small text-muted'>
                            <span>More results</span>
                            <span>Closer matches</span>
                        </div> */}
                    </div>
                    <button type='button' className='btn btn-outline-secondary btn-sm' onClick={clearImageSearch}>
                        Clear
                    </button>
                </div>
            )}
        </div>

        <div  style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: "400px", overflowY :"auto"}}>
            {
                showTextResults && filteredProducts.slice(0, 20).map((product) => {
                    const hasVariant = product.colors && product.colors.length > 0 && Array.isArray(product.colorPrices) && product.colorPrices.length > 0;
                    let variantRange = null;
                    if(hasVariant){
                        const prices = product.colors.map((c, idx) => product.colorPrices[idx]).filter(v=>v!==undefined);
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        variantRange = {
                            minBase: min.toFixed(2),
                            maxBase: max.toFixed(2),
                            minDiscount: (min - (min * product.discount)/100).toFixed(2),
                            maxDiscount: (max - (max * product.discount)/100).toFixed(2)
                        };
                    }
                    const oneVariant = product.colors && product.colors.length == 1 && Array.isArray(product.colorPrices) && product.colorPrices.length == 1;
                    const discountedPrice = (!hasVariant && product.discount > 0) ? (product.price - (product.price * product.discount) / 100).toFixed(2) : null;
                    
                    const renderPrice = () => {
                        if (!oneVariant) {
                            if (hasVariant) {
                            if (product.discount > 0) {
                                return (
                                <>
                                    ${variantRange.minDiscount}
                                    <del className="text-sm text-gray-500 ml-1">${variantRange.minBase}</del>
                                    - ${variantRange.maxDiscount}
                                    <del className="text-sm text-gray-500 ml-1">${variantRange.maxBase}</del>
                                </>
                                );
                            } else {
                                return variantRange.minBase === variantRange.maxBase
                                ? `$${variantRange.minBase}`
                                : `$${variantRange.minBase} - $${variantRange.maxBase}`;
                            }
                            } else {
                            return product.discount > 0 ? (
                                <>
                                ${discountedPrice}{' '}
                                <del className="text-sm text-gray-500 ml-1">${product.price}</del>
                                </>
                            ) : (
                                `$${product.price}`
                            );
                            }
                        } else {
                            return product.discount > 0
                            ? 
                                <>
                                    ${variantRange.minDiscount}{' '}
                                    <del className="text-sm text-gray-500 ml-1">${variantRange.minBase}</del>
                                </>
                            : `$${variantRange.minBase}`;
                        }
                        };

                    return(
                    <Link key = {product._id.toString()} href = {`/shop/${product._id.toString()}`}>
                        <div className='d-flex gap-3 p-2'>
                            <div>
                                <div className='pro-thumb h-25'>
                                    <img src = {product.images[0]} alt = "" className='flex-shrink-0'/>
                                </div>
                            </div>

                            <div className='product-content'>
                                <p>
                                    <Link href = {`/shop/${product._id.toString()}`}>
                                    {product.name}
                                    </Link>
                                </p>
                                <h6>
                                    {renderPrice()}
                                </h6>
                            </div>
                        </div>
                    </Link>
                    )
                })
            }

            {showImageResults && (
                <>
                    {isImageSearching && (
                        <div className='p-2 text-center text-muted small'>Searching for similar items…</div>
                    )}
                    {!isImageSearching && imageMatches.length === 0 && !imageSearchError && imageFile && (
                        <div className='p-2 text-center text-muted small'>No similar products found.</div>
                    )}
                    {imageMatches.slice(0, 10).map((match) => {
                        const { previewUrl, previewAlt, bestMatch } = getMatchPreview(match);
                        const variantMatches = Array.isArray(match.variantMatches) ? match.variantMatches : [];
                        const similarOptions = Array.isArray(match.similarOptions) ? match.similarOptions : [];
                        const hasVariantMatches = variantMatches.length > 0;
                        const matchSimilarity = Number(bestMatch?.similarity ?? match.similarity);
                        const matchKey = match.productId || `${match.productName}-${match.slug || ''}`;

                        console.log(match)
                        return (
                            <Link key={matchKey} href={`/shop/${match.productId}`}>
                                <div className='d-flex flex-column gap-2 p-2'>
                                    <div className='d-flex gap-3 align-items-center'>
                                        <div className='pro-thumb h-25'>
                                            {previewUrl ? (
                                                <img
                                                    src={previewUrl}
                                                    alt={previewAlt}
                                                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }}
                                                />
                                            ) : (
                                                <div
                                                    className='d-flex align-items-center justify-content-center bg-light border rounded'
                                                    style={{ width: '80px', height: '80px' }}
                                                >
                                                    <span className='small text-muted'>No image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className='product-content flex-grow-1'>
                                            <p className='mb-1 fw-semibold'>{match.productName}</p>
                                            {Number.isFinite(matchSimilarity) && (
                                                <p className='small text-muted mb-0'>{Math.round(matchSimilarity)}% visual match</p>
                                            )}
                                            {/* {bestMatch?.matchType && (
                                                <p className='small text-muted mb-0'>
                                                    {bestMatch.matchType === 'color'
                                                        ? `Matches option${bestMatch.colorLabel ? `: ${bestMatch.colorLabel}` : ''}`
                                                        : 'Matches primary product photo'}
                                                </p>
                                            )} */}
                                            {/* {!bestMatch?.matchType && hasVariantMatches && similarOptions.length > 0 && (
                                                <p className='small text-muted mb-0'>
                                                    Matches option{similarOptions.length > 1 ? 's' : ''}: {similarOptions[0]}
                                                </p>
                                            )} */}
                                        </div>
                                    </div>
                                    {/* {hasVariantMatches && (
                                        <div className='d-flex flex-wrap gap-2 ps-1'>
                                            {variantMatches.map((variant) => {
                                                const variantKey = `${variant.fingerprint || variant.index}-${variant.imageUrl}`;
                                                return (
                                                    <div key={variantKey} className='d-flex flex-column align-items-center small text-muted'>
                                                        <img
                                                            src={variant.imageUrl}
                                                            alt={variant.colorLabel ? `${variant.colorLabel} option` : 'Variant match'}
                                                            style={{
                                                                width: '48px',
                                                                height: '48px',
                                                                objectFit: 'cover',
                                                                borderRadius: '6px',
                                                                border:
                                                                    variant.fingerprint === bestMatch?.fingerprint
                                                                        ? '2px solid #28a745'
                                                                        : '1px solid #dee2e6',
                                                            }}
                                                        />
                                                        {variant.colorLabel && (
                                                            <span className='text-capitalize mt-1'>{variant.colorLabel}</span>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )} */}
                                {/* {!hasVariantMatches && bestMatch?.matchType === 'primary' && Array.isArray(match.primaryMatches) && match.primaryMatches.length > 1 && (
                                        <div className='d-flex flex-wrap gap-2 ps-1'>
                                            {match.primaryMatches.map((primary) => {
                                                const primaryKey = `${primary.fingerprint || primary.index}-${primary.imageUrl}`;
                                                return (
                                                    <img
                                                        key={primaryKey}
                                                        src={primary.imageUrl}
                                                        alt='Primary match'
                                                        style={{
                                                            width: '48px',
                                                            height: '48px',
                                                            objectFit: 'cover',
                                                            borderRadius: '6px',
                                                            border:
                                                                primary.fingerprint === bestMatch?.fingerprint
                                                                    ? '2px solid #28a745'
                                                                    : '1px solid #dee2e6',
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )} */}
                                </div>
                            </Link>
                        );
                    })}
                    {imageSearchError && (
                        <div className='p-2 text-center text-danger small'>{imageSearchError}</div>
                    )}
                </>
            )}
        </div>
    </div>
  )
}

Search.propTypes = {
    products: PropTypes.arrayOf(
        PropTypes.shape({
            _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
            name: PropTypes.string.isRequired,
            images: PropTypes.arrayOf(PropTypes.string),
            price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            discount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
            colors: PropTypes.arrayOf(PropTypes.string),
            colorPrices: PropTypes.arrayOf(PropTypes.number),
        })
    ).isRequired,
};

export default Search