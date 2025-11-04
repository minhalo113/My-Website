import React,{useState, useEffect, useCallback, useRef} from 'react'
import Rating from '../../components/Rating'
import PropTypes from 'prop-types'
import api from '../../src/api/api';
import toast from 'react-hot-toast';

const reviewTitle = 'Add a Review'

const DEFAULT_COUNT = 5;
const DEFAULT_ICON = "★";
const DEFAULT_UNSELECTED_COLOR = "grey";
const DEFAULT_COLOR = "#facc15";

const Review = ({ item, reloadFunction, reviewList, page = 1, totalPages = 1, totalReviews = 0, onPageChange }) => {
  const { description, _id } = item || {}

  const [comment, setComment] = useState("")
  const [rating, setRating] = useState(0);
  const [temporaryRating, setTemporaryRating] = useState(0);
  const [imageEntries, setImageEntries] = useState([]);
  const objectUrlRef = useRef(new Set());
  const fileInputRef = useRef(null);

  const clearNewEntryPreviews = useCallback((entries = []) => {
    entries.forEach((entry) => {
      if (entry && entry.type === 'new' && entry.url) {
        URL.revokeObjectURL(entry.url);
        objectUrlRef.current.delete(entry.url);
      }
    });
  }, []);

  const replaceImageEntries = useCallback((nextEntries) => {
    setImageEntries((prev) => {
      clearNewEntryPreviews(prev);
      return nextEntries;
    });
  }, [clearNewEntryPreviews]);

  const buildExistingEntry = useCallback((image, index) => {
    if (!image) return null;
    const url = image.url || '';
    if (!url) return null;
    const identifier = image.identifier || image.publicId || `image-${index}`;
    return {
      id: identifier,
      identifier,
      url,
      type: 'existing',
      publicId: image.publicId || null,
      resourceType: image.resourceType || 'image',
    };
  }, []);

  const createNewEntry = useCallback((file) => {
    if (!file) return null;
    const previewUrl = URL.createObjectURL(file);
    objectUrlRef.current.add(previewUrl);
    return {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      type: 'new',
      file,
      url: previewUrl,
    };
  }, []);

  useEffect(() => {
    return () => {
      objectUrlRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      objectUrlRef.current.clear();
    };
  }, []);

  const fetchMyReview = useCallback(async () => {
    if (!_id) {
      replaceImageEntries([]);
      setRating(0);
      setTemporaryRating(0);
      setComment('');
      return;
    }

    const productId = typeof _id === 'object' ? _id.toString() : _id;
    if (!productId) {
      return;
    }

    try {
      const { data } = await api.get(`/my-product-review/${productId}`, { withCredentials: true });
      const review = data?.review;
      if (!review) {
        replaceImageEntries([]);
        setComment('');
        setRating(0);
        setTemporaryRating(0);
        return;
      }

      const normalizedRating = Number(review.rating) || 0;
      setComment(review.comment || '');
      setRating(normalizedRating);
      setTemporaryRating(normalizedRating);
      const entries = Array.isArray(review.images)
        ? review.images
            .map((image, index) => buildExistingEntry(image, index))
            .filter(Boolean)
        : [];
      replaceImageEntries(entries);
    } catch (error) {
      if (error?.response?.status === 401) {
        replaceImageEntries([]);
        setComment('');
        setRating(0);
        setTemporaryRating(0);
        return;
      }
      console.log(error);
    }
  }, [_id, buildExistingEntry, replaceImageEntries]);

  useEffect(() => {
    fetchMyReview();
  }, [fetchMyReview]);
  let stars = Array(DEFAULT_COUNT).fill(DEFAULT_ICON);

  const handleClick = (rating) => {
    setRating(rating);
  };

  const submitRating = async(e, productIdentifier) => {
    e.preventDefault()

    if (!rating) {
      toast.error("Please select a star rating before submitting.")
      return
    }

    const productId = typeof productIdentifier === 'object' ? productIdentifier?.toString() : productIdentifier
    if (!productId) {
      toast.error("Missing product identifier.")
      return
    }

    const trimmedComment = comment.trim()
    const formData = new FormData()
    formData.append('rating', String(rating))
    if (trimmedComment) {
      formData.append('comment', trimmedComment)
    }

    const keepImageKeys = imageEntries
      .filter((entry) => entry.type === 'existing')
      .map((entry) => entry.identifier)
      .filter(Boolean)
    formData.append('keepImageKeys', JSON.stringify(keepImageKeys))

    imageEntries
      .filter((entry) => entry.type === 'new' && entry.file)
      .forEach((entry) => {
        formData.append('images', entry.file)
      })
    try{
      const res = await api.post(`/rate-product/${productId}`, formData, {
        withCredentials: true,
      });
      toast.success(res.data.message)
      setComment("")
      setRating(0)
      setTemporaryRating(0)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      await fetchMyReview()
    }catch(err){
      console.log(err)
      toast.error(
        err?.response?.data?.message || err.message || "Something went wrong"
      );
    }
    reloadFunction()
  }

  const titleStyle = {
    fontSize: '1.6rem',
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: '0.75rem',
    borderBottom: '2px solid #3498db',
    paddingBottom: '0.25rem',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    paddingLeft: '1rem',
    paddingTop: '1rem'
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) {
      return;
    }
    const newEntries = files
      .map((file) => createNewEntry(file))
      .filter(Boolean);
    if (!newEntries.length) {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    setImageEntries((prev) => [...prev, ...newEntries]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  const handleRemoveImage = (id) => {
    setImageEntries((prevEntries) => {
      const entry = prevEntries.find((imageEntry) => imageEntry.id === id);
      if (entry && entry.type === 'new' && entry.url) {
        URL.revokeObjectURL(entry.url);
        objectUrlRef.current.delete(entry.url);
      }
      return prevEntries.filter((imageEntry) => imageEntry.id !== id);
    });
  }

  return (
    <>  
      <div className="review-content description-show description-section">
        <h3 style={titleStyle} className="section-title">Description</h3>
        <div className="description">
          <p style={{ whiteSpace: 'pre-wrap' }}>
            {description}
          </p>
        </div>
      </div>

      <div className="review-content review-content-show reviews-section">
        <h3 style={titleStyle} className="section-title">Reviews</h3>
        <div className="review-showing">
          <ul className="content lab-ul">
            {reviewList.map((review, i) => {
              const displayName = review.displayName || review.name || 'Anonymous';
              const referenceDate = review.reviewDate || review.createdAt || review.updatedAt;
              const reviewDate = referenceDate ? new Date(referenceDate).toISOString().slice(0, 10) : '';

              return (
                <li key={i} className="review-item">
                <div className="post-thumb">
                  <img src={review?.userImage?.url || '/images/profile-default-image.png'} />
                </div>
                <div className="post-content">
                  <div className="entry-meta">
                    <div className="posted-on flex items-start gap-2">
                      <a href="#" className="pointer-events-none text-gray-500">{displayName}</a>
                      <p>{reviewDate}</p>
                    </div>
                    <div className="flex items-center gap-1 h-full">
                        {stars.map((item, index) => {
                          const isActiveColor = review.rating;

                          const elementColor = isActiveColor ? DEFAULT_COLOR : DEFAULT_UNSELECTED_COLOR;

                          return (
                            <div
                              key={index}
                              className="transition-transform duration-150 hover:scale-110 cursor-pointer"
                              style={{
                                fontSize: "24px",
                                color: elementColor,
                                filter: index < isActiveColor ? "grayscale(0%)" : "grayscale(100%)",
                                lineHeight: 1
                              }}
                            >
                              {DEFAULT_ICON}
                            </div>
                          );
                        })}
                      </div>
                  </div>
                  <div className="entry-content">
                    <p>{review.comment}</p>
                    {review.images && review.images.length > 0 && (
                      <div className="flex gap-2 flex-wrap mt-2">
                        {review.images.map((img, idx) => (
                          <img key={idx} src={img} alt="review" className="w-20 h-20 object-cover rounded" />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between flex-wrap gap-3 mt-4">
              <button
                type="button"
                className="default-button !px-4 !py-2"
                disabled={page <= 1}
                onClick={() => onPageChange && onPageChange(page - 1)}
              >
                <span>Previous</span>
              </button>
              <p className="m-0 text-sm text-slate-600">
                Page {page} of {totalPages} &middot; {totalReviews} review{totalReviews === 1 ? '' : 's'}
              </p>
              <button
                type="button"
                className="default-button !px-4 !py-2"
                disabled={page >= totalPages}
                onClick={() => onPageChange && onPageChange(page + 1)}
              >
                <span>Next</span>
              </button>
            </div>
          )}

          <div className="client-review">
            <div className="review-form">
              <div className="review-title mb-4">
                <h5>{reviewTitle}</h5>
              </div>
              <form className="row">
                {/* <div className="col-md-4 col-12">
                  <input type="text" name="name" placeholder="Full Name *" />
                </div>
                <div className="col-md-4 col-12">
                  <input type="email" name="email" placeholder="Your Email *" />
                </div> */}
                <div className="flex items-center gap-2 rounded-md p-3" style={{ height: "60px" }}>
                <p className="text-sm font-semibold text-slate-700 m-0 flex items-center h-full leading-none mr-3">
                  Your Rating:     
                </p>
                <div className="flex items-center gap-1 h-full">
                  {stars.map((item, index) => {
                    const isActiveColor =
                      (rating || temporaryRating) &&
                      (index < rating || index < temporaryRating);

                    const elementColor = isActiveColor ? DEFAULT_COLOR : DEFAULT_UNSELECTED_COLOR;

                    return (
                      <div
                        key={index}
                        className="transition-transform duration-150 hover:scale-110 cursor-pointer"
                        style={{
                          fontSize: "24px",
                          color: elementColor,
                          filter: isActiveColor ? "grayscale(0%)" : "grayscale(100%)",
                          lineHeight: 1
                        }}
                        onMouseEnter={() => setTemporaryRating(index + 1)}
                        onMouseLeave={() => setTemporaryRating(0)}
                        onClick={() => handleClick(index + 1)}
                      >
                        {DEFAULT_ICON}
                      </div>
                    );
                  })}
                </div>
              </div>


                <div className="col-md-12 col-12">
                  <textarea name="message" rows="8" placeholder="Type Your Message" value={comment} onChange={e => setComment(e.target.value)}></textarea>
                </div>
                <div className="col-md-12 col-12 flex flex-col gap-2">
                  <label htmlFor="review-images" className="font-semibold text-slate-700">Add Images</label>
                  <input
                    id="review-images"
                    type="file"
                    multiple
                    onChange={handleImageChange}
                    ref={fileInputRef}
                  />
                </div>
                {imageEntries.length > 0 && (
                  <div className="col-md-12 col-12">
                    <div className="flex flex-wrap gap-3">
                      {imageEntries.map((entry) => (
                        <div key={entry.id} className="relative w-20 h-20 rounded overflow-hidden shadow-sm">
                          <img src={entry.url} alt="Selected review" className="w-20 h-20 object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(entry.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-black text-white text-xs flex items-center justify-center"
                            aria-label="Remove image"
                          >
                            &times;
                          </button>
                          {entry.type === 'existing' && (
                            <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1 rounded">
                              Saved
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="col-12">
                  <button onClick={(e) => submitRating(e, _id)} type="submit" className="default-button">
                    <span>Submit Review</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

Review.propTypes = {
  item: PropTypes.shape({
    description: PropTypes.string,
    _id: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  }).isRequired,
  reloadFunction: PropTypes.func.isRequired,
  reviewList: PropTypes.array.isRequired,
  page: PropTypes.number,
  totalPages: PropTypes.number,
  totalReviews: PropTypes.number,
  onPageChange: PropTypes.func,
}

Review.defaultProps = {
  page: 1,
  totalPages: 1,
  totalReviews: 0,
  onPageChange: () => {},
}

export default Review;
