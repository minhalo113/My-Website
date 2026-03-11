import React, { useEffect, useState, useCallback } from 'react';
import api from '../../api/api';
import toast from 'react-hot-toast';
import { FaTrash } from 'react-icons/fa';

const ScrapedReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [totalReviews, setTotalReviews] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const parPage = 20;

    // Edit state
    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        content: '',
        reviewImages: [],
        authorThumb: '',
        authorThumbEnabled: true,
        date: '',
        rating: 5
    });

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

    const handleApprove = async (id) => {
        try {
            await toast.promise(
                api.put(`/reviews/scraped/${id}/approve`, {}, { withCredentials: true }),
                {
                    loading: 'Approving...',
                    success: 'Review approved and added to product!',
                    error: 'Failed to approve review'
                }
            );
            fetchReviews();
        } catch (error) {
            console.error('Error approving review:', error);
        }
    };

    const handleReject = async (id) => {
        if (!window.confirm("Are you sure you want to reject and delete this review?")) return;
        try {
            await toast.promise(
                api.delete(`/reviews/scraped/${id}/reject`, { withCredentials: true }),
                {
                    loading: 'Rejecting...',
                    success: 'Review rejected and deleted!',
                    error: 'Failed to reject review'
                }
            );
            fetchReviews();
        } catch (error) {
            console.error('Error rejecting review:', error);
        }
    };

    const handleEditClick = (review) => {
        let dateValue = review.date;
        try {
            const parsedDate = new Date(review.date);
            if (!isNaN(parsedDate.getTime())) {
                dateValue = parsedDate.toISOString().split('T')[0];
            }
        } catch (e) {
            // keep as is
        }

        setEditingReviewId(review._id);
        setEditFormData({
            content: review.content || '',
            reviewImages: review.reviewImages || [],
            authorThumb: review.authorThumb || '',
            authorThumbEnabled: !!review.authorThumb,
            date: dateValue,
            rating: review.rating || 5
        });
    };

    const handleCancelEdit = () => {
        setEditingReviewId(null);
    };

    const handleFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleRemoveImage = (indexToRemove) => {
        setEditFormData(prev => ({
            ...prev,
            reviewImages: prev.reviewImages.filter((_, i) => i !== indexToRemove)
        }));
    };

    const handleSaveEdit = async (id) => {
        try {
            let finalDate = editFormData.date;
            try {
                const parsedDate = new Date(editFormData.date);
                if (!isNaN(parsedDate.getTime())) {
                    finalDate = parsedDate.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
                }
            } catch (e) { }

            const payload = {
                content: editFormData.content,
                reviewImages: editFormData.reviewImages,
                authorThumb: editFormData.authorThumbEnabled ? editFormData.authorThumb : null,
                date: finalDate,
                rating: Number(editFormData.rating)
            };

            await toast.promise(
                api.put(`/reviews/scraped/${id}`, payload, { withCredentials: true }),
                {
                    loading: 'Saving...',
                    success: 'Review updated successfully!',
                    error: 'Failed to update review'
                }
            );
            setEditingReviewId(null);
            fetchReviews();
        } catch (error) {
            console.error('Error saving review:', error);
        }
    };

    return (
        <div className='px-2 lg:px-7 pt-5'>
            <div className='w-full p-4 bg-[#6a5fdf] rounded-md'>
                <div className='flex justify-between items-center mb-4'>
                    <h1 className='text-xl font-semibold text-[#d0d2d6]'>Scraped Reviews ({totalReviews} Pending)</h1>
                </div>

                <div className='flex flex-col gap-4'>
                    {reviews.map((review) => {
                        const isEditing = editingReviewId === review._id;

                        return (
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

                                        {!isEditing ? (
                                            <>
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
                                            </>
                                        ) : (
                                            /* Edit Form */
                                            <div className='flex flex-col gap-3 text-[#d0d2d6]'>
                                                <div className='flex items-center gap-3 mb-2'>
                                                    {/* Profile Image Toggle */}
                                                    <div className='flex flex-col gap-1'>
                                                        <label className='text-xs'>Profile Image</label>
                                                        <div className='flex items-center gap-2'>
                                                            <label className='flex items-center cursor-pointer'>
                                                                <div className='relative'>
                                                                    <input
                                                                        type='checkbox'
                                                                        className='sr-only'
                                                                        name='authorThumbEnabled'
                                                                        checked={editFormData.authorThumbEnabled}
                                                                        onChange={handleFormChange}
                                                                    />
                                                                    <div className={`block w-10 h-6 rounded-full transition-colors ${editFormData.authorThumbEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                                                                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${editFormData.authorThumbEnabled ? 'transform translate-x-4' : ''}`}></div>
                                                                </div>
                                                            </label>
                                                            {editFormData.authorThumbEnabled && editFormData.authorThumb && (
                                                                <img src={editFormData.authorThumb} alt="Author" className='w-8 h-8 rounded-full object-cover ml-2' />
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Rating Input */}
                                                    <div className='flex flex-col gap-1 ml-4'>
                                                        <label className='text-xs'>Rating</label>
                                                        <select
                                                            name='rating'
                                                            value={editFormData.rating}
                                                            onChange={handleFormChange}
                                                            className='px-2 py-1 bg-[#6a5fdf] border border-gray-400 rounded-md text-white focus:outline-none'
                                                        >
                                                            {[1, 2, 3, 4, 5].map(num => (
                                                                <option key={num} value={num}>{num} Star{num > 1 ? 's' : ''}</option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Date Input */}
                                                    <div className='flex flex-col gap-1 ml-4'>
                                                        <label className='text-xs'>Date</label>
                                                        <input
                                                            type='date'
                                                            name='date'
                                                            value={editFormData.date}
                                                            onChange={handleFormChange}
                                                            className='px-2 py-1 bg-[#6a5fdf] border border-gray-400 rounded-md text-white focus:outline-none'
                                                        />
                                                    </div>
                                                </div>

                                                {/* Content Input */}
                                                <div className='flex flex-col gap-1'>
                                                    <label className='text-xs'>Comment Content</label>
                                                    <textarea
                                                        name='content'
                                                        value={editFormData.content}
                                                        onChange={handleFormChange}
                                                        className='w-full px-3 py-2 bg-[#6a5fdf] border border-gray-400 rounded-md text-white focus:outline-none resize-none'
                                                        rows='3'
                                                    ></textarea>
                                                </div>

                                                {/* Review Images Edit */}
                                                {editFormData.reviewImages.length > 0 && (
                                                    <div className='flex flex-col gap-1'>
                                                        <label className='text-xs'>Review Images</label>
                                                        <div className='flex flex-wrap gap-3 mt-1'>
                                                            {editFormData.reviewImages.map((imgUrl, i) => (
                                                                <div key={i} className='relative group'>
                                                                    <img src={imgUrl} alt={`Review ${i}`} className='w-20 h-20 object-cover rounded-md border border-[#d0d2d6]' />
                                                                    <button
                                                                        onClick={() => handleRemoveImage(i)}
                                                                        className='absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors z-10'
                                                                        title="Remove Image"
                                                                    >
                                                                        <FaTrash size={12} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className='flex md:flex-col justify-end gap-2 min-w-[120px]'>
                                        {!isEditing ? (
                                            <>
                                                <button
                                                    className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm transition-colors'
                                                    onClick={() => handleEditClick(review)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className='bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-md text-sm transition-colors'
                                                    onClick={() => handleApprove(review._id)}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    className='bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-md text-sm transition-colors'
                                                    onClick={() => handleReject(review._id)}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    className='bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm transition-colors'
                                                    onClick={() => handleSaveEdit(review._id)}
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    className='bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md text-sm transition-colors'
                                                    onClick={handleCancelEdit}
                                                >
                                                    Cancel
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}

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
