import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import PropTypes from 'prop-types';
import api from '../../src/api/api';

const DEFAULT_THRESHOLD = 64;
const TEXT_SEARCH_DEBOUNCE = 300;
const PRICE_FILTER_DEBOUNCE = 400;
const PRICE_INPUT_REGEX = /^\d*(\.\d{0,2})?$/;

const parsePriceInput = (value) => {
    if (value === undefined || value === null) return null;
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed || trimmed === '.') return null;
        const parsedFromString = Number(trimmed);
        if (!Number.isFinite(parsedFromString) || parsedFromString < 0) return null;
        return parsedFromString;
    }
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return parsed;
};

const Search = ({
    searchTerm,
    onSearchTermChange,
    minPrice,
    maxPrice,
    onPriceRangeChange,
    selectedCategory,
    onCategoryChange,
    categoryFacets,
    availableCategories,
    totalProducts,
}) => {
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm || "");

    const [localMinPrice, setLocalMinPrice] = useState(minPrice != null ? String(minPrice) : '');
    const [localMaxPrice, setLocalMaxPrice] = useState(maxPrice != null ? String(maxPrice) : '');

    const [showDropdown, setShowDropdown] = useState(true)
    const dropdownRef = useRef(null)

    const [imageFile, setImageFile] = useState(null);
    const [imageMatches, setImageMatches] = useState([]);
    const [isImageSearching, setIsImageSearching] = useState(false);
    const [imageSearchError, setImageSearchError] = useState('');
    const [imageThreshold, setImageThreshold] = useState(DEFAULT_THRESHOLD);
    const [queryPreview, setQueryPreview] = useState(null);

    const [textResults, setTextResults] = useState([]);
    const [isTextSearching, setIsTextSearching] = useState(false);
    const [textSearchError, setTextSearchError] = useState('');
    const [textSuggestions, setTextSuggestions] = useState([]);

    const normalizedSelectedCategory = selectedCategory && typeof selectedCategory === 'string' ? selectedCategory : 'all';

    const categoryOptions = useMemo(() => {
        const facetOptions = Array.isArray(categoryFacets)
            ? categoryFacets
                .filter((facet) => facet && typeof facet.value === 'string' && facet.value.trim())
                .map((facet) => ({
                    value: facet.value.trim(),
                    label: facet.value.trim(),
                    count: Number.isFinite(Number(facet.count)) ? Number(facet.count) : null,
                }))
            : [];

        const fallbackOptions = Array.isArray(availableCategories)
            ? availableCategories
                .filter((name) => typeof name === 'string' && name.trim())
                .map((name) => ({
                    value: name.trim(),
                    label: name.trim(),
                    count: null,
                }))
            : [];

        const merged = new Map();
        facetOptions.forEach((option) => {
            merged.set(option.value, option);
        });
        fallbackOptions.forEach((option) => {
            if (!merged.has(option.value)) {
                merged.set(option.value, option);
            }
        });

        return Array.from(merged.values()).sort((a, b) => {
            const aHasCount = Number.isFinite(a.count);
            const bHasCount = Number.isFinite(b.count);
            if (aHasCount && bHasCount && a.count !== b.count) {
                return b.count - a.count;
            }
            if (aHasCount && !bHasCount) {
                return -1;
            }
            if (!aHasCount && bHasCount) {
                return 1;
            }
            return a.label.localeCompare(b.label);
        });
    }, [availableCategories, categoryFacets]);

    const formattedTotalProducts = Number.isFinite(Number(totalProducts)) ? Number(totalProducts).toLocaleString() : null;

    useEffect(() => {
        setLocalSearchTerm(searchTerm || "");
    }, [searchTerm]);

    useEffect(() => {
        const parsed = parsePriceInput(minPrice);
        if (parsed != null) {
            setLocalMinPrice((prev) => (prev === String(parsed) ? prev : String(parsed)));
        } else if (minPrice === null || minPrice === undefined || minPrice === '') {
            setLocalMinPrice((prev) => (prev === '' ? prev : ''));
        }
    }, [minPrice]);

    useEffect(() => {
        const parsed = parsePriceInput(maxPrice);
        if (parsed != null) {
            setLocalMaxPrice((prev) => (prev === String(parsed) ? prev : String(parsed)));
        } else if (maxPrice === null || maxPrice === undefined || maxPrice === '') {
            setLocalMaxPrice((prev) => (prev === '' ? prev : ''));
        }
    }, [maxPrice]);

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

    useEffect(() => {
        if (!onSearchTermChange) return undefined;

        const handler = setTimeout(() => {
            onSearchTermChange(localSearchTerm);
        }, TEXT_SEARCH_DEBOUNCE);

        return () => {
            clearTimeout(handler);
        };
    }, [localSearchTerm, onSearchTermChange]);

    useEffect(() => {
        if (!onPriceRangeChange) return undefined;

        const handler = setTimeout(() => {
            const min = parsePriceInput(localMinPrice);
            const max = parsePriceInput(localMaxPrice);
            console.log(min, max)
            onPriceRangeChange({ min, max });
        }, PRICE_FILTER_DEBOUNCE);

        return () => {
            clearTimeout(handler);
        };
    }, [localMinPrice, localMaxPrice, onPriceRangeChange]);

    useEffect(() => {
        setTextResults([]);
        setTextSuggestions([]);
        setTextSearchError('');

        const trimmed = localSearchTerm.trim();
        const parsedMin = parsePriceInput(localMinPrice);
        const parsedMax = parsePriceInput(localMaxPrice);

        if (!trimmed) {
            setIsTextSearching(false);
            return undefined;
        }

        let ignore = false;
        const timer = setTimeout(async () => {
            setIsTextSearching(true);
            try {
                const { data } = await api.get('/customers-products-search', {
                    params: {
                        q: trimmed,
                        limit: 12,
                        ...(parsedMin != null ? { minPrice: parsedMin } : {}),
                        ...(parsedMax != null ? { maxPrice: parsedMax } : {}),
                    },
                    withCredentials: true,
                });

                console.log("hi2")
                console.log(parsedMin)
                console.log(parsedMax)
                console.log(data.results.minPrice, data.results.maxPrice)
                console.log(data)

                if (ignore) return;

                setTextResults(Array.isArray(data?.results) ? data.results : []);
                setTextSuggestions(Array.isArray(data?.suggestions) ? data.suggestions : []);
                setTextSearchError('');
            } catch (error) {
                if (ignore) return;
                console.log(error);
                setTextResults([]);
                setTextSuggestions([]);
                const message = error?.response?.data?.error || 'Unable to search products.';
                setTextSearchError(message);
            } finally {
                if (!ignore) {
                    setIsTextSearching(false);
                }
            }
        }, TEXT_SEARCH_DEBOUNCE);

        return () => {
            ignore = true;
            clearTimeout(timer);
        };
    }, [localSearchTerm, localMinPrice, localMaxPrice]);

    const handleMinPriceInputChange = useCallback((event) => {
        console.log("set min")
        const value = event.target.value.trim();
        if (value === '' || PRICE_INPUT_REGEX.test(value)) {
            setLocalMinPrice(value);
        }
    }, []);

    const handleMaxPriceInputChange = useCallback((event) => {
        console.log("set max")
        const value = event.target.value.trim();
        if (value === '' || PRICE_INPUT_REGEX.test(value)) {
            setLocalMaxPrice(value);
        }
    }, []);

    const handleClearPriceFilters = useCallback(() => {
        setLocalMinPrice('');
        setLocalMaxPrice('');
    }, []);

    const resetPreview = useCallback(() => {
        setQueryPreview((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return null;
        });
    }, []);

    const switchToTextSearch = useCallback((value) => {
        setLocalSearchTerm(value);
        setTextResults([]);
        setTextSuggestions([]);
        setTextSearchError('');
        setImageFile(null);
        setImageMatches([]);
        setImageSearchError('');
        setIsImageSearching(false);
        setImageThreshold(DEFAULT_THRESHOLD);
        resetPreview();
        setShowDropdown(true);
    }, [resetPreview]);

    const handleSearchChange = (e) => {
        switchToTextSearch(e.target.value);
    };

    const handleCategoryChange = useCallback(
        (event) => {
            if (!onCategoryChange) return;
            const { value } = event.target;
            onCategoryChange(value || 'all');
        },
        [onCategoryChange],
    );

    const handleClearCategory = useCallback(() => {
        if (onCategoryChange) {
            onCategoryChange('all');
        }
    }, [onCategoryChange]);

    const handleSuggestionSelect = useCallback((suggestion) => {
        if (!suggestion) return;
        const value = typeof suggestion === 'string' ? suggestion : suggestion.text;
        if (!value) return;
        switchToTextSearch(value);
    }, [switchToTextSearch]);

    const handleImageChange = (event) => {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            setImageSearchError('Please choose a valid image file.');
            event.target.value = '';
            return;
        }

        setLocalSearchTerm('');
        setTextResults([]);
        setTextSearchError('');
        setTextSuggestions([]);
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

    const handleImageThresholdChange = useCallback((event) => {
        const value = Number(event.target.value);
        if (Number.isFinite(value)) {
            setImageThreshold(value);
        } else {
            setImageThreshold(DEFAULT_THRESHOLD);
        }
    }, []);

    const clearImageSearch = () => {
        setImageFile(null);
        setImageMatches([]);
        setImageSearchError('');
        setIsImageSearching(false);
        setImageThreshold(DEFAULT_THRESHOLD);
        resetPreview();
        setShowDropdown(false);
        setTextSuggestions([]);
    };

    const formatPriceDisplay = useCallback((price, discount) => {
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
    }, []);

    const parsedMinPrice = parsePriceInput(localMinPrice);
    const parsedMaxPrice = parsePriceInput(localMaxPrice);
    const showPriceRangeNotice = parsedMinPrice != null && parsedMaxPrice != null && parsedMaxPrice < parsedMinPrice;

    const showTextResults = Boolean(localSearchTerm.trim() && showDropdown);
    const showImageResults = Boolean(!localSearchTerm && showDropdown && (imageMatches.length > 0 || imageSearchError || isImageSearching || queryPreview));

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

    const renderTextResultPrice = useCallback((product) => {
        const hasVariant = product.colors && product.colors.length > 0 && Array.isArray(product.colorPrices) && product.colorPrices.length > 0;
        let variantRange = null;
        if (hasVariant) {
            const prices = product.colors.map((c, idx) => product.colorPrices[idx]).filter(v => v !== undefined);
            if (prices.length) {
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                variantRange = {
                    minBase: min.toFixed(2),
                    maxBase: max.toFixed(2),
                    minDiscount: (min - (min * product.discount) / 100).toFixed(2),
                    maxDiscount: (max - (max * product.discount) / 100).toFixed(2)
                };
            }
        }
        const oneVariant = product.colors && product.colors.length == 1 && Array.isArray(product.colorPrices) && product.colorPrices.length == 1;
        const discountedPrice = (!hasVariant && product.discount > 0) ? (product.price - (product.price * product.discount) / 100).toFixed(2) : null;

        if (!oneVariant) {
            if (hasVariant && variantRange) {
                if (product.discount > 0) {
                    return (
                        <>
                            ${variantRange.minDiscount}
                            <del className="text-sm text-gray-500 ml-1">${variantRange.minBase}</del>
                            - ${variantRange.maxDiscount}
                            <del className="text-sm text-gray-500 ml-1">${variantRange.maxBase}</del>
                        </>
                    );
                }
                return variantRange.minBase === variantRange.maxBase
                    ? `$${variantRange.minBase}`
                    : `$${variantRange.minBase} - $${variantRange.maxBase}`;
            }
            if (!hasVariant) {
                return product.discount > 0 ? (
                    <>
                        ${discountedPrice}{' '}
                        <del className="text-sm text-gray-500 ml-1">${product.price}</del>
                    </>
                ) : (
                    `$${product.price}`
                );
            }
        } else if (variantRange) {
            return product.discount > 0
                ?
                <>
                    ${variantRange.minDiscount}{' '}
                    <del className="text-sm text-gray-500 ml-1">${variantRange.minBase}</del>
                </>
                : `$${variantRange.minBase}`;
        }

        return formatPriceDisplay(product.price, product.discount);
    }, [formatPriceDisplay]);

    return (
        <div className='widget widget-search' ref={dropdownRef}>
            <form className='search-wrapper mb-3' onSubmit={(e) => e.preventDefault()}>
                <input type='text' name="search" id="search" placeholder='Search...'
                    value={localSearchTerm}
                    onChange={handleSearchChange} />

                <button type='submit'>
                    <i className='icofont-search-2'></i>
                </button>
            </form>

            <div className='mb-3 p-3 border rounded' style={{ background: '#f8f9fa' }}>
                <h6 className='fw-semibold mb-2'>Filter by category</h6>
                <select
                    className='form-select form-select-sm'
                    value={normalizedSelectedCategory}
                    onChange={handleCategoryChange}
                >
                    <option value='all'>
                        {`All categories${formattedTotalProducts ? ` (${formattedTotalProducts})` : ''}`}
                    </option>
                    {categoryOptions.map((option) => {
                        const displayCount = Number.isFinite(option.count) ? option.count.toLocaleString() : null;
                        return (
                            <option key={option.value} value={option.value}>
                                {`${option.label}${displayCount ? ` (${displayCount})` : ''}`}
                            </option>
                        );
                    })}
                </select>
                <div className='d-flex justify-content-between align-items-center mt-2'>
                    <small className='text-muted'>Narrow your results by selecting a category.</small>
                    <button
                        type='button'
                        className='btn btn-link btn-sm p-0'
                        onClick={handleClearCategory}
                        disabled={normalizedSelectedCategory === 'all'}
                    >
                        Reset
                    </button>
                </div>
            </div>

            <div className='mb-3 p-3 border rounded' style={{ background: '#f8f9fa' }}>
                <h6 className='fw-semibold mb-2'>Filter by price</h6>
                <div className='row g-2 align-items-end'>
                    <div className='col'>
                        <label className='form-label small text-muted mb-1' htmlFor='min-price-input'>Min price</label>
                        <input
                            id='min-price-input'
                            type='text'
                            inputMode='decimal'
                            className='form-control form-control-sm'
                            value={localMinPrice}
                            onChange={handleMinPriceInputChange}
                            placeholder='0.00'
                            aria-describedby='price-filter-help'
                        />
                    </div>
                    <div className='col'>
                        <label className='form-label small text-muted mb-1' htmlFor='max-price-input'>Max price</label>
                        <input
                            id='max-price-input'
                            type='text'
                            inputMode='decimal'
                            className='form-control form-control-sm'
                            value={localMaxPrice}
                            onChange={handleMaxPriceInputChange}
                            placeholder='0.00'
                            aria-describedby='price-filter-help'
                        />
                    </div>
                </div>
                <div className='d-flex justify-content-between align-items-center mt-2'>
                    <small id='price-filter-help' className='text-muted'>Enter prices in CAD.</small>
                    <button
                        type='button'
                        className='btn btn-link btn-sm p-0'
                        onClick={handleClearPriceFilters}
                        disabled={!localMinPrice && !localMaxPrice}
                    >
                        Clear
                    </button>
                </div>
                {showPriceRangeNotice && (
                    <p className='small text-warning mb-0 mt-2'>
                        Max price is lower than min price. Results will swap the values automatically.
                    </p>
                )}
            </div>


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
                        <Image
                            src={queryPreview}
                            alt='Selected reference'
                            width={80}
                            height={80}
                            unoptimized
                            style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #dee2e6' }}
                        />
                        <button type='button' className='btn btn-outline-secondary btn-sm' onClick={clearImageSearch}>
                            Clear
                        </button>
                    </div>
                )}
                {/* 
            <div className='mt-3'>
                <label htmlFor='image-threshold-input' className='form-label small text-muted mb-1'>Match strictness</label>
                <input
                    id='image-threshold-input'
                    type='range'
                    min='0'
                    max='64'
                    step='1'
                    value={imageThreshold}
                    className='form-range'
                    onChange={handleImageThresholdChange}
                    disabled={!imageFile}
                />
                <p className='small text-muted mb-0'>Maximum Hamming distance: {imageThreshold}. Lower values return only near-identical matches.</p>
            </div> */}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: "400px", overflowY: "auto" }}>
                {
                    showTextResults && (
                        <>
                            {isTextSearching && (
                                <div className='p-2 text-center text-muted small'>Searching...</div>
                            )}
                            {!isTextSearching && textSearchError && (
                                <div className='p-2 text-center text-danger small'>{textSearchError}</div>
                            )}
                            {!isTextSearching && !textSearchError && textResults.length === 0 && textSuggestions.length === 0 && (
                                <div className='p-2 text-center text-muted small'>No products found.</div>
                            )}
                            {/* {!isTextSearching && textSuggestions.length > 0 && (
                            <div className='px-2'>
                                <p className='small text-uppercase text-muted fw-semibold mb-2'>Top suggestions</p>
                                {textSuggestions.map((suggestion) => {
                                    const suggestionKey = suggestion.productId || suggestion.slug || suggestion.text;
                                    const meta = [suggestion.brand, suggestion.category].filter(Boolean).join(' • ');
                                    const relevanceLabel = suggestion.relevance?.label;
                                    const relevanceScore = suggestion.relevance?.score;
                                    return (
                                        <button
                                            type='button'
                                            key={suggestionKey}
                                            className='w-100 text-start btn btn-outline-secondary mb-2'
                                            onClick={() => handleSuggestionSelect(suggestion)}
                                        >
                                            <span className='d-block fw-semibold text-truncate'>{suggestion.text}</span>
                                            <span className='d-flex justify-content-between small text-muted'>
                                                <span>{meta || 'View matching results'}</span>
                                                {relevanceLabel && (
                                                    <span className='text-capitalize'>
                                                        {relevanceLabel} match
                                                        {Number.isFinite(relevanceScore) ? ` • ${relevanceScore}%` : ''}
                                                    </span>
                                                )}
                                            </span>
                                        </button>
                                    );
                                })}
                                <hr className='my-2' />
                            </div>
                        )} */}
                            {textResults.slice(0, 20).map((product) => (
                                <Link key={product._id?.toString() || product._id} href={`/shop/${product._id?.toString() || product._id}`}>
                                    <div className='d-flex gap-3 p-2'>
                                        <div className="pro-thumb" style={{ flex: "0 0 64px", width: 64, height: 64 }}>
                                            <Image
                                                src={product.coverImage || product.images?.[0] || "/placeholder.png"}
                                                alt={product.name}
                                                width={64}
                                                height={64}
                                                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8, display: "block" }}
                                            />
                                        </div>
                                        <div className='product-content flex-grow-1'>
                                            <p className='mb-1 fw-semibold text-truncate'>{product.name}</p>
                                            {product.relevance?.label && (
                                                <p className='small text-muted mb-1 text-capitalize'>
                                                    {product.relevance.label} relevance
                                                    {Number.isFinite(product.relevance?.score) ? ` • ${product.relevance.score}% match` : ''}
                                                </p>
                                            )}
                                            <h6 className='mb-0'>
                                                {renderTextResultPrice(product)}
                                            </h6>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </>
                    )
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
                            const matchSimilarity = Number(bestMatch?.similarity ?? match.similarity);
                            const matchKey = match.productId || `${match.productName}-${match.slug || ''}`;
                            return (
                                <Link key={matchKey} href={`/shop/${match.productId}`}>
                                    <div className='d-flex flex-column gap-2 p-2'>
                                        <div className='d-flex gap-3 align-items-center'>
                                            <div className='pro-thumb h-25'>
                                                {previewUrl ? (
                                                    <Image
                                                        src={previewUrl}
                                                        alt={previewAlt}
                                                        width={80}
                                                        height={80}
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
                                            </div>
                                        </div>

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
    searchTerm: PropTypes.string,
    onSearchTermChange: PropTypes.func,
    minPrice: PropTypes.number,
    maxPrice: PropTypes.number,
    onPriceRangeChange: PropTypes.func,
    selectedCategory: PropTypes.string,
    onCategoryChange: PropTypes.func,
    categoryFacets: PropTypes.arrayOf(
        PropTypes.shape({
            value: PropTypes.string,
            count: PropTypes.number,
        }),
    ),
    availableCategories: PropTypes.arrayOf(PropTypes.string),
    totalProducts: PropTypes.number,
};

Search.defaultProps = {
    searchTerm: '',
    onSearchTermChange: undefined,
    minPrice: null,
    maxPrice: null,
    onPriceRangeChange: undefined,
    selectedCategory: 'all',
    onCategoryChange: undefined,
    categoryFacets: [],
    availableCategories: [],
    totalProducts: null,
};

export default Search