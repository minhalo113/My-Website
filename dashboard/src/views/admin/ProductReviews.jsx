import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  fetch_product_reviews,
  update_product_review,
  delete_product_review,
  messageClear,
} from '../../store/Reducers/productReducer';

const stars = [1, 2, 3, 4, 5];

const ProductReviews = () => {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    reviewList,
    reviewLoader,
    selectedProductName,
    averageProductRating,
    reviewCount,
    successMessage,
    errorMessage,
  } = useSelector((state) => state.product);

  useEffect(() => {
    if (productId) {
      dispatch(fetch_product_reviews(productId));
    }
  }, [dispatch, productId]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [errorMessage, dispatch]);

  const handleRefresh = () => {
    if (productId) {
      dispatch(fetch_product_reviews(productId));
    }
  };

  const handleEdit = (review) => {
    if (!productId) return;
    const updatedMessage = window.prompt('Update review comment', review.comment || '');
    if (updatedMessage === null) return;

    const trimmedMessage = updatedMessage.trim();
    if (!trimmedMessage) {
      toast.error('Comment message cannot be empty.');
      return;
    }

    const ratingPrompt = window.prompt(
      'Update rating (1-5). Leave blank to keep the current rating.',
      review.rating != null ? String(review.rating) : ''
    );

    const payload = { comment: trimmedMessage };

    if (ratingPrompt === null) {
      dispatch(update_product_review({ productId, reviewId: review._id, payload }));
      return;
    }

    const normalizedRating = ratingPrompt.trim();
    if (normalizedRating) {
      const parsed = Number(normalizedRating);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 5) {
        toast.error('Rating must be a number between 1 and 5.');
        return;
      }
      payload.rating = parsed;
    }

    dispatch(update_product_review({ productId, reviewId: review._id, payload }));
  };

  const handleDelete = (review) => {
    if (!productId) return;
    const confirmed = window.confirm('Delete this review? This action cannot be undone.');
    if (!confirmed) return;

    dispatch(delete_product_review({ productId, reviewId: review._id }));
  };

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Reviews</h1>
          <p className="text-sm text-gray-500">
            Moderate customer feedback for{' '}
            <span className="font-semibold text-gray-700">{selectedProductName || 'this product'}</span>.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Average rating: {averageProductRating?.toFixed ? averageProductRating.toFixed(1) : Number(averageProductRating || 0).toFixed(1)}{' '}
            ({reviewCount} review{reviewCount === 1 ? '' : 's'})
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleRefresh}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Customer</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Rating</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Comment</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Submitted</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Updated</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reviewLoader ? (
                <tr>
                  <td colSpan="6" className="px-6 py-6 text-center text-gray-500">
                    Loading reviews...
                  </td>
                </tr>
              ) : reviewList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-6 text-center text-gray-500">
                    No reviews yet.
                  </td>
                </tr>
              ) : (
                reviewList.map((review) => (
                  <tr key={review._id} className="align-top">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-3">
                        {review?.userImage?.url ? (
                          <img
                            src={review.userImage.url}
                            alt={review.name || 'Customer avatar'}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                            {review?.name ? review.name.charAt(0).toUpperCase() : '?'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{review.name || 'Customer'}</p>
                          {review.user && (
                            <p className="text-xs text-gray-400">User ID: {review.user}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{review.rating ?? '—'}</span>
                        <div className="flex text-yellow-500">
                          {stars.map((star) => (
                            <span key={star} className={star <= (review.rating || 0) ? '' : 'text-gray-300'}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-pre-wrap">
                      <p>{review.comment || '—'}</p>
                      {review.isEdited && (
                        <span className="text-xs text-indigo-500 font-medium mt-1 inline-block">Edited</span>
                      )}
                      {Array.isArray(review.images) && review.images.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                          {review.images.map((img, index) => (
                            <img
                              key={index}
                              src={img}
                              alt={`review-${index}`}
                              className="w-16 h-16 rounded object-cover border"
                            />
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(review.createdAt)}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDate(review.updatedAt)}</td>
                    <td className="px-6 py-4 text-sm text-right space-x-2 whitespace-nowrap">
                      <button
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        onClick={() => handleEdit(review)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        onClick={() => handleDelete(review)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;