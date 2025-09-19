import React, { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { messageClear, search_product_by_image } from '../../store/Reducers/productReducer';

const clampThreshold = (value) => {
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return 10;
    return Math.max(0, Math.min(64, Math.round(numeric)));
};

const ProductImageSearch = () => {
    const dispatch = useDispatch();
    const {
        imageSearchResults,
        imageSearchLoading,
        imageSearchMeta,
        imageSearchMessage,
        errorMessage,
    } = useSelector((state) => state.product);

    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [threshold, setThreshold] = useState(10);

    useEffect(() => {
        if (!selectedFile) {
            setPreviewUrl('');
            return () => {};
        }
        const url = URL.createObjectURL(selectedFile);
        setPreviewUrl(url);
        return () => {
            URL.revokeObjectURL(url);
        };
    }, [selectedFile]);

    useEffect(() => {
        if (errorMessage) {
            toast.error(errorMessage);
            dispatch(messageClear());
        }
    }, [errorMessage, dispatch]);

    useEffect(() => {
        if (imageSearchMessage) {
            const hasMatches = (imageSearchMeta?.returnedMatches || 0) > 0;
            if (hasMatches) {
                toast.success(imageSearchMessage);
            } else {
                toast(imageSearchMessage);
            }
            dispatch(messageClear());
        }
    }, [imageSearchMessage, imageSearchMeta, dispatch]);

    const handleFileChange = (event) => {
        const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
        setSelectedFile(file);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!selectedFile) {
            toast.error('Please select an image to search.');
            return;
        }
        const sanitizedThreshold = clampThreshold(threshold);
        setThreshold(sanitizedThreshold);
        dispatch(search_product_by_image({ imageFile: selectedFile, threshold: sanitizedThreshold }));
    };

    const thresholdDisplay = useMemo(() => clampThreshold(threshold), [threshold]);

    const hasResults = (imageSearchResults || []).length > 0;

    return (
        <div className='px-2 lg:px-7 pt-5'>
            <h1 className='text-[#000000] font-semibold text-lg mb-5'>Reverse Image Search</h1>
            <div className='grid gap-5 lg:grid-cols-[320px_auto] items-start'>
                <div className='w-full bg-[#6a5fdf] rounded-md p-5 text-[#f1f1f1]'>
                    <form onSubmit={handleSubmit} className='space-y-5'>
                        <div>
                            <label className='block text-sm font-semibold mb-2'>Search Image</label>
                            <input
                                type='file'
                                accept='image/*'
                                onChange={handleFileChange}
                                className='block w-full text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-white/20 file:text-white hover:file:bg-white/30 cursor-pointer'
                            />
                            <p className='text-xs text-slate-200 mt-2'>Upload a product or variant image to look for similar listings already in the catalog.</p>
                        </div>
                        <div>
                            <label className='block text-sm font-semibold mb-2'>Hamming Distance Threshold</label>
                            <input
                                type='number'
                                min='0'
                                max='64'
                                value={threshold}
                                onChange={(e) => setThreshold(e.target.value)}
                                className='w-full bg-[#4f46c5] border border-white/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-white/40'
                            />
                            <p className='text-xs text-slate-200 mt-2'>Lower values require a closer match. The default value of 10 works well for near-duplicates.</p>
                        </div>
                        <button
                            type='submit'
                            disabled={imageSearchLoading}
                            className='w-full py-2 px-4 rounded-md bg-white text-[#4f46c5] font-semibold hover:bg-white/90 transition disabled:opacity-70 disabled:cursor-not-allowed'
                        >
                            {imageSearchLoading ? 'Searching…' : 'Search Images'}
                        </button>
                    </form>

                    {previewUrl && (
                        <div className='mt-6'>
                            <h2 className='text-sm font-semibold mb-2'>Query Preview</h2>
                            <img
                                src={previewUrl}
                                alt='Query preview'
                                className='w-full max-h-72 object-contain rounded-md border border-white/20 bg-[#4f46c5]'
                            />
                            <p className='text-xs text-slate-200 mt-2'>Current threshold: {thresholdDisplay}</p>
                        </div>
                    )}
                </div>

                <div className='w-full bg-[#6a5fdf] rounded-md p-5 text-[#f1f1f1]'>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
                        <div>
                            <h2 className='text-base font-semibold'>Results</h2>
                            {imageSearchMeta && (
                                <p className='text-xs text-slate-200 mt-1'>
                                    Threshold ≤ {imageSearchMeta.threshold ?? 10}. Showing {imageSearchMeta.returnedMatches || 0}
                                    {imageSearchMeta.totalMatches ? ` of ${imageSearchMeta.totalMatches}` : ''} matches.
                                </p>
                            )}
                        </div>
                        {imageSearchMeta?.queryFingerprint && (
                            <p className='text-[11px] text-slate-200 break-all bg-[#4f46c5] rounded-md px-3 py-1'>
                                Fingerprint: {imageSearchMeta.queryFingerprint}
                            </p>
                        )}
                    </div>

                    <div className='relative overflow-x-auto mt-4'>
                        <table className='w-full text-sm text-left text-[#d0d2d6]'>
                            <thead className='text-xs uppercase border-b border-white/20'>
                                <tr>
                                    <th className='py-3 px-4 whitespace-nowrap'>Image</th>
                                    <th className='py-3 px-4 whitespace-nowrap'>Product</th>
                                    <th className='py-3 px-4 whitespace-nowrap'>Match Type</th>
                                    <th className='py-3 px-4 whitespace-nowrap'>Similarity</th>
                                    <th className='py-3 px-4 whitespace-nowrap'>Distance</th>
                                    <th className='py-3 px-4 whitespace-nowrap'>Color</th>
                                    <th className='py-3 px-4 whitespace-nowrap'>Stock</th>
                                    <th className='py-3 px-4 whitespace-nowrap'>Price</th>
                                    <th className='py-3 px-4 whitespace-nowrap'>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hasResults ? (
                                    imageSearchResults.map((match) => (
                                        <tr key={`${match.productId}-${match.matchType}-${match.index}`} className='border-b border-white/10 last:border-b-0'>
                                            <td className='py-3 px-4'>
                                                <img
                                                    src={match.imageUrl}
                                                    alt={match.productName}
                                                    className='w-16 h-16 object-cover rounded-md border border-white/10'
                                                />
                                            </td>
                                            <td className='py-3 px-4'>
                                                <div className='flex flex-col gap-1'>
                                                    <span className='font-semibold text-white'>{match.productName}</span>
                                                    <span className='text-[11px] text-slate-200'>Brand: {match.brand || '—'}</span>
                                                    <span className='text-[11px] text-slate-200'>Category: {match.category || '—'}</span>
                                                </div>
                                            </td>
                                            <td className='py-3 px-4 capitalize'>{match.matchType === 'color' ? 'Color Variant' : 'Primary Image'}</td>
                                            <td className='py-3 px-4'>{match.similarity != null ? `${match.similarity}%` : '—'}</td>
                                            <td className='py-3 px-4'>{match.distance ?? '—'}</td>
                                            <td className='py-3 px-4'>{match.colorLabel || '—'}</td>
                                            <td className='py-3 px-4'>{match.stock ?? '—'}</td>
                                            <td className='py-3 px-4'>
                                                {match.price != null ? `$${Number(match.price).toFixed(2)}` : '—'}
                                            </td>
                                            <td className='py-3 px-4'>
                                                <div className='flex flex-col gap-2'>
                                                    <Link
                                                        to={`/admin/dashboard/edit-product/${match.productId}`}
                                                        className='text-xs font-semibold text-white bg-[#4f46c5] hover:bg-[#443ab8] px-3 py-1 rounded-md text-center'
                                                    >
                                                        Review Product
                                                    </Link>
                                                    {match.link && (
                                                        <a
                                                            href={match.link}
                                                            target='_blank'
                                                            rel='noreferrer'
                                                            className='text-xs text-white underline text-center'
                                                        >
                                                            View Listing
                                                        </a>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan='9' className='py-8 px-4 text-center text-sm text-slate-200'>
                                            {imageSearchLoading
                                                ? 'Looking for similar products…'
                                                : 'Upload an image and start a search to see potential matches.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductImageSearch;