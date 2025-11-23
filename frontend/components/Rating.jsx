import PropTypes from 'prop-types';
import React from 'react';

const MAX_STARS = 5;

const Rating = ({ rating, number_of_ratings }) => {
  const formattedRating = Number.isFinite(rating) ? rating.toFixed(1) : '0.0';
  const reviewLabel = `${number_of_ratings || 0} review${number_of_ratings === 1 ? '' : 's'}`;

  return (
    <div className="flex flex-col items-start gap-1 text-gray-700 leading-tight">
      <div className="rating flex items-center gap-2 text-yellow-400">
        {[...Array(MAX_STARS)].map((_, index) => {
          const fillPercent = Math.min(Math.max(rating - index, 0), 1) * 100;

          return (
            <div
              key={index}
              className="relative text-gray-300"
              style={{ fontSize: '18px', width: '1em', height: '1em' }}
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
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-yellow-200 bg-white/90 px-3 py-1 text-xs font-semibold text-[#101115] shadow-sm">
        <span className="text-[11px] uppercase tracking-wide text-yellow-500">{formattedRating}★</span>
        <span className="text-gray-700">{reviewLabel}</span>
      </div>
    </div>
  );
};

Rating.propTypes = {
  rating: PropTypes.number.isRequired,
  number_of_ratings: PropTypes.number.isRequired
};

export default Rating;