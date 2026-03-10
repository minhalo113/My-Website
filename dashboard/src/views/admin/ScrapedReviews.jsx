import React, { useEffect, useState } from 'react';
import api from '../../api/api';
import toast from 'react-hot-toast';

import { useCallback } from 'react';

const ScrapedReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [totalReviews, setTotalReviews] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const parPage = 20;

    const fetchReviews = useCallback(async () => {
        try {
            const { data } = await api.get(`/reviews/scraped?page=${currentPage}&parPage=${parPage}`, { withCredentials: true });
            setReviews(data.reviews);
            setTotalReviews(data.totalReviews);
        } catch (error) {
            console.error('Error fetching scraped reviews', error);
            toast.error('Failed to fetch scraped reviews');
        }
    }, [currentPage, parPage]);

    useEffect(() => {
        fetchReviews();
    }, [currentPage, fetchReviews]);

    const renderStars = (rating) => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span key={i} className={`text-xl ${i <= rating ? 'text-yellow-500' : 'text-gray-300'}`}>
                    ★
                </span>
            );
        }
        return stars;
    };

    return (
        <div className='px-2 lg:px-7 pt-5'>
            <div className='w-full p-4 bg-[#6a5fdf] rounded-md'>
                <div className='flex justify-between items-center mb-4'>
                    <h1 className='text-xl font-semibold text-[#d0d2d6]'>Scraped Reviews ({totalReviews} Pending)</h1>
                </div>

                <div className='flex flex-col gap-4'>
                    {reviews.map((review) => (
                        <div key={review._id} className='bg-[#8288ed] p-4 rounded-md shadow-sm'>
                            <div className='flex flex-col md:flex-row justify-between gap-4'>
                                <div className='flex-1'>
                                    {/* Product Info */}
                                    <div className='mb-2 pb-2 border-b border-[#6a5fdf]'>
                                        <h3 className='text-sm font-bold text-[#d0d2d6]'>
                                            Product: {review.productId ? review.productId.name : 'Unknown Product'}
                                            <span className='ml-2 text-xs text-gray-300'>({review.productId?._id})</span>
                                        </h3>
                                    </div>

                                    {/* Author & Rating */}
                                    <div className='flex items-center gap-3 mb-3'>
                                        {review.authorThumb ? (
                                            <img src={review.authorThumb} alt="Author" className='w-10 h-10 rounded-full object-cover border border-[#d0d2d6]' />
                                        ) : (
                                            <div className='w-10 h-10 rounded-full bg-gray-400 flex justify-center items-center text-[#d0d2d6]'>
                                                N/A
                                            </div>
                                        )}
                                        <div>
                                            <div className='flex'>{renderStars(review.rating)}</div>
                                            <p className='text-xs text-[#d0d2d6]'>{review.date}</p>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className='mb-3'>
                                        <p className='text-[#d0d2d6] text-sm'>{review.content}</p>
                                    </div>

                                    {/* Review Images */}
                                    {review.reviewImages && review.reviewImages.length > 0 && (
                                        <div className='flex flex-wrap gap-2 mt-2'>
                                            {review.reviewImages.map((imgUrl, i) => (
                                                <img key={i} src={imgUrl} alt={`Review ${i}`} className='w-20 h-20 object-cover rounded-md border border-[#d0d2d6]' />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className='flex md:flex-col justify-end gap-2 min-w-[120px]'>
                                    <button
                                        className='bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-sm transition-colors'
                                        onClick={() => toast.success('Approve functionality to be wired later')}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        className='bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm transition-colors'
                                        onClick={() => toast.success('Reject functionality to be wired later')}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {reviews.length === 0 && (
                        <div className='text-center text-[#d0d2d6] py-10'>
                            No pending scraped reviews found.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScrapedReviews;