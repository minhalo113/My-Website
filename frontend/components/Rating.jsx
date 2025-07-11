import PropTypes from 'prop-types';
import React from 'react';

const MAX_STARS = 5;

const Rating = ({rating, number_of_ratings}) => {
  return (
    <div>
      <span className='rating flex gap-1 text-yellow-400'>
        {[...Array(MAX_STARS)].map((_, index) => {
          const fillPercent = Math.min(Math.max(rating - index, 0), 1) * 100;

          return (
            <div
              key={index}
              className="relative text-gray-300"
              style={{ fontSize: '20px', width: '1em', height: '1em' }}
            >
              <i className="icofont-ui-rating absolute left-0 top-0" style={{ color: 'gray' }} />
              <i
                className="icofont-ui-rating absolute left-0 top-0 overflow-hidden"
                style={{
                  width: `${fillPercent}%`,
                  color: 'gold',
                  whiteSpace: 'nowrap'
                }}
              />
            </div>
          );
        })}
        <h6>{rating}</h6>
    </span>
    <p>({number_of_ratings} reviews)</p>
    </div>
  )
}

Rating.propTypes = {
  rating: PropTypes.number.isRequired,
  number_of_ratings: PropTypes.number.isRequired
};

export default Rating