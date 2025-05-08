import React from 'react'
import Rating from '../../components/Rating'
import PropTypes from 'prop-types'

const reviewTitle = 'Add a Review'

const ReviewList = [
  { imgUrl: '/images/instructor/01.jpg', imgAlt: 'Client thumb', name: 'Ganelon Boileau', date: 'Posted on Jun 10, 2022 at 6:57 am', desc: 'Enthusiast build innovative initiatives before longterm high-impact theme SEO PSD porta monetize covalent leadership without resource.' },
  { imgUrl: '/images/instructor/02.jpg', imgAlt: 'Client thumb', name: 'Morgana Cailot', date: 'Posted on Jun 10, 2022 at 6:57 am', desc: 'Enthusiast build innovative initiatives before longterm high-impact theme SEO PSD porta monetize covalent leadership without resource.' },
  { imgUrl: '/images/instructor/03.jpg', imgAlt: 'Client thumb', name: 'Telford Bois', date: 'Posted on Jun 10, 2022 at 6:57 am', desc: 'Enthusiast build innovative initiatives before longterm high-impact theme SEO PSD porta monetize covalent leadership without resource.' },
  { imgUrl: '/images/instructor/04.jpg', imgAlt: 'Client thumb', name: 'Cher Daviau', date: 'Posted on Jun 10, 2022 at 6:57 am', desc: 'Enthusiast build innovative initiatives before longterm high-impact theme SEO PSD porta monetize covalent leadership without resource.' }
];

const Review = ({ item }) => {
  const { description } = item || {}

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
          <p style={{ whiteSpace: 'pre-line' }}>
            {description}
          </p>
        </div>
      </div>

      <div className="review-content review-content-show reviews-section">
        <h3 style={titleStyle} className="section-title">Reviews</h3>
        <div className="review-showing">
          <ul className="content lab-ul">
            {ReviewList.map((review, i) => (
              <li key={i} className="review-item">
                <div className="post-thumb">
                  <img src={review.imgUrl} alt={review.imgAlt} />
                </div>
                <div className="post-content">
                  <div className="entry-meta">
                    <div className="posted-on">
                      <a href="#">{review.name}</a>
                      <p>{review.date}</p>
                    </div>
                  </div>
                  <div className="entry-content">
                    <p>{review.desc}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="client-review">
            <div className="review-form">
              <div className="review-title">
                <h5>{reviewTitle}</h5>
              </div>
              <form className="row">
                <div className="col-md-4 col-12">
                  <input type="text" name="name" placeholder="Full Name *" />
                </div>
                <div className="col-md-4 col-12">
                  <input type="email" name="email" placeholder="Your Email *" />
                </div>
                <div className="col-md-4 col-12">
                  <div className="rating">
                    <span className="me-2">Your Rating</span>
                    <Rating />
                  </div>
                </div>
                <div className="col-md-12 col-12">
                  <textarea name="message" rows="8" placeholder="Type Your Message"></textarea>
                </div>
                <div className="col-12">
                  <button type="submit" className="default-button">
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
  }).isRequired
}

export default Review
