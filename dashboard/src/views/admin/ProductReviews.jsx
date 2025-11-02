import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  fetch_product_reviews,
  create_fake_product_review,
  update_product_review,
  delete_product_review,
  messageClear,
} from '../../store/Reducers/productReducer';

const stars = [1, 2, 3, 4, 5];

const ProductReviews = () => {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [formState, setFormState] = useState({
    name: '',
    rating: '5',
    comment: '',
    reviewDate: '',
  });
  const [profileImage, setProfileImage] = useState(null);
  const [reviewImages, setReviewImages] = useState([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

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

  useEffect(() => {
    return () => {
      if (profileImage?.preview) {
        URL.revokeObjectURL(profileImage.preview);
      }
      reviewImages.forEach((item) => {
        if (item?.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });
    };
  }, [profileImage, reviewImages]);

  const handleRefresh = () => {
    if (productId) {
      dispatch(fetch_product_reviews(productId));
    }
  };

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileImageChange = (event) => {
    const file = event.target.files?.[0];
    setProfileImage((prev) => {
      if (prev?.preview) {
        URL.revokeObjectURL(prev.preview);
      }
      if (file) {
        return { file, preview: URL.createObjectURL(file) };
      }
      return null;
    });
    if (event.target) {
      event.target.value = '';
    }
  };

  const handleRemoveProfileImage = () => {
    setProfileImage((prev) => {
      if (prev?.preview) {
        URL.revokeObjectURL(prev.preview);
      }
      return null;
    });
  };

  const handleReviewImagesChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setReviewImages((prev) => {
      const mapped = files.map((file) => ({ file, preview: URL.createObjectURL(file) }));
      return [...prev, ...mapped];
    });

    if (event.target) {
      event.target.value = '';
    }
  };

  const handleRemoveReviewImage = (index) => {
    setReviewImages((prev) => {
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      if (removed?.preview) {
        URL.revokeObjectURL(removed.preview);
      }
      return next;
    });
  };

  const handleAddFakeReview = async (event) => {
    event.preventDefault();
    if (!productId) return;

    const trimmedComment = formState.comment.trim();
    if (!trimmedComment) {
      toast.error('Review comment is required.');
      return;
    }

    const parsedRating = Number(formState.rating);
    if (!Number.isFinite(parsedRating) || parsedRating < 1 || parsedRating > 5) {
      toast.error('Rating must be a number between 1 and 5.');
      return;
    }

    const payload = new FormData();
    const trimmedName = formState.name.trim();
    if (trimmedName) {
      payload.append('name', trimmedName);
    }
    payload.append('rating', String(parsedRating));
    payload.append('comment', trimmedComment);
    if (formState.reviewDate) {
      payload.append('reviewDate', formState.reviewDate);
    }
    if (profileImage?.file) {
      payload.append('profileImage', profileImage.file);
    }
    reviewImages.forEach(({ file }) => {
      payload.append('reviewImages', file);
    });

    try {
      setIsSubmittingReview(true);
      await dispatch(create_fake_product_review({ productId, payload })).unwrap();
      setFormState({ name: '', rating: '5', comment: '', reviewDate: '' });
      setProfileImage((prev) => {
        if (prev?.preview) {
          URL.revokeObjectURL(prev.preview);
        }
        return null;
      });
      reviewImages.forEach((item) => {
        if (item?.preview) {
          URL.revokeObjectURL(item.preview);
        }
      });
      setReviewImages([]);
    } catch (error) {
      // Errors are surfaced via toasts in global handlers
    } finally {
      setIsSubmittingReview(false);
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

      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Review</h2>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={handleAddFakeReview}>
          <div>
            <label htmlFor="fake-review-name" className="block text-sm font-medium text-gray-700">
              Display name
            </label>
            <input
              id="fake-review-name"
              name="name"
              type="text"
              value={formState.name}
              onChange={handleFieldChange}
              placeholder="e.g. Jane D."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="fake-review-rating" className="block text-sm font-medium text-gray-700">
              Rating
            </label>
            <select
              id="fake-review-rating"
              name="rating"
              value={formState.rating}
              onChange={handleFieldChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              {stars.map((star) => (
                <option key={star} value={String(star)}>
                  {star} star{star === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fake-review-date" className="block text-sm font-medium text-gray-700">
              Review date
            </label>
            <input
              id="fake-review-date"
              name="reviewDate"
              type="datetime-local"
              value={formState.reviewDate}
              onChange={handleFieldChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-gray-400">Leave blank to use the current date and time.</p>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="fake-review-comment" className="block text-sm font-medium text-gray-700">
              Review comment
            </label>
            <textarea
              id="fake-review-comment"
              name="comment"
              rows="4"
              value={formState.comment}
              onChange={handleFieldChange}
              placeholder="Share the faux customer experience..."
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="fake-review-profile-image" className="block text-sm font-medium text-gray-700">
              Profile image
            </label>
            <input
              id="fake-review-profile-image"
              type="file"
              accept="image/*"
              onChange={handleProfileImageChange}
              className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
            />
            {profileImage?.preview && (
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={profileImage.preview}
                  alt="Profile preview"
                  className="w-16 h-16 rounded-full object-cover border"
                />
                <button
                  type="button"
                  onClick={handleRemoveProfileImage}
                  className="rounded-md border border-gray-300 px-3 py-1 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
          <div>
            <label htmlFor="fake-review-images" className="block text-sm font-medium text-gray-700">
              Review images
            </label>
            <input
              id="fake-review-images"
              type="file"
              accept="image/*"
              multiple
              onChange={handleReviewImagesChange}
              className="mt-1 block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-600 hover:file:bg-indigo-100"
            />
            {reviewImages.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-3">
                {reviewImages.map((item, index) => (
                  <div key={`${item.preview}-${index}`} className="relative">
                    <img
                      src={item.preview}
                      alt={`Review preview ${index + 1}`}
                      className="h-20 w-20 rounded-md object-cover border"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveReviewImage(index)}
                      className="absolute -top-2 -right-2 rounded-full bg-white p-1 text-xs font-semibold text-gray-600 shadow hover:bg-gray-100"
                      aria-label="Remove image"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
              disabled={isSubmittingReview || reviewLoader}
            >
              {isSubmittingReview ? 'Saving review...' : 'Add review'}
            </button>
          </div>
        </form>
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
                reviewList.map((review) => {
                  const displayName = review.displayName || review.name || 'Customer';
                  const originalName =
                    review.originalName && review.originalName !== displayName
                      ? review.originalName
                      : null;
                  const avatarInitial = displayName.charAt(0).toUpperCase() || '?';

                  return (
                    <tr key={review._id} className="align-top">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-3">
                        {review?.userImage?.url ? (
                          <img
                            src={review.userImage.url}
                            alt={displayName || 'Customer avatar'}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                              {avatarInitial}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold">{displayName}</p>
                          {originalName && (
                            <p className="text-xs text-gray-400">Original: {originalName}</p>
                          )}
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
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;