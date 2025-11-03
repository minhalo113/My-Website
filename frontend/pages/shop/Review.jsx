import React,{useState} from 'react'
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
  const [images, setImages] = useState([]);
  let stars = Array(DEFAULT_COUNT).fill(DEFAULT_ICON);

  const handleClick = (rating) => {
    setRating(rating);
  };

  const submitRating = async(e, _id) => {
    e.preventDefault()

    if (!rating) {
      toast.error("Please select a star rating before submitting.")
      return
    }

    const trimmedComment = comment.trim()
    const payload = {
      rating,
      images
    }

    if (trimmedComment) {
      payload.comment = trimmedComment
    }

    try{
      const res = await api.post(`/rate-product/${_id}`, payload, {withCredentials: true});
      toast.success(res.data.message)
      setComment("")
      setRating(0)
      setTemporaryRating(0)
      setImages([])
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
    const promises = files.map(file => {
      return new Promise(resolve => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      })
    });
    Promise.all(promises).then(imgs => setImages(imgs));
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
                  />
                </div>
                <div className="col-12">
                  <button onClick={(e) => submitRating(e, _id.toString())} type="submit" className="default-button">
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

export default Review
