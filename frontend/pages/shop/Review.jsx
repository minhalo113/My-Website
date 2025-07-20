import React,{useState, useEffect} from 'react'
import Rating from '../../components/Rating'
import PropTypes from 'prop-types'
import api from '../../src/api/api';
import toast from 'react-hot-toast';

const reviewTitle = 'Add a Review'

const DEFAULT_COUNT = 5;
const DEFAULT_ICON = "★";
const DEFAULT_UNSELECTED_COLOR = "grey";
const DEFAULT_COLOR = "#facc15";

const Review = ({ item, reloadFunction, reviewList }) => {
  const { description, _id } = item || {}

  const [comment, setComment] = useState("")

  const [rating, setRating] = useState(0);
  const [temporaryRating, setTemporaryRating] = useState(0);
  let stars = Array(DEFAULT_COUNT).fill(DEFAULT_ICON);

  const handleClick = (rating) => {
    setRating(rating);
  };

  const submitRating = async(e, _id) => {
    e.preventDefault()
    try{
      const res = await api.post(`/rate-product/${_id}`, {rating, comment}, {withCredentials: true});
      toast.success(res.data.message)
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
            {reviewList.map((review, i) => (
              <li key={i} className="review-item">
                <div className="post-thumb">
                  <img src={review?.userImage?.url}/>
                </div>
                <div className="post-content">
                  <div className="entry-meta">
                    <div className="posted-on flex items-start gap-2">
                      <a href="#" className="pointer-events-none text-gray-500">{review.name}</a>
                      <p>{new Date(review.createdAt).toISOString().slice(0, 10)}</p>
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
                  </div>
                </div>
              </li>
            ))}
          </ul>

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
    description: PropTypes.string.isRequired
  }).isRequired,
  reloadFunction: PropTypes.func.isRequired,
  reviewList: PropTypes.array.isRequired
}

export default Review
