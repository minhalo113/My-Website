import React, { useRef } from 'react';
import PropTypes from 'prop-types';

const Search = ({
    setParPage,
    setSearchValue,
    searchValue,
    onImageSearch = null,
    imageSearchLoading = false,
    enableImageSearch = false,
}) => {
    const fileInputRef = useRef(null);

    const handleFileChange = (event) => {
        const file = event.target.files && event.target.files[0];
        if (file && onImageSearch) {
            onImageSearch(file);
        }
        event.target.value = '';
    };

    return (
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
    );
};

Search.propTypes = {
    setParPage: PropTypes.func.isRequired,
    setSearchValue: PropTypes.func.isRequired,
    searchValue: PropTypes.string.isRequired,
    onImageSearch: PropTypes.func,
    imageSearchLoading: PropTypes.bool,
    enableImageSearch: PropTypes.bool,
};

export default Search;