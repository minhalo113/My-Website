import React from 'react';
import PropTypes from 'prop-types';

const DiscountBadge = ({ discount }) => {
  if (!discount || discount <= 0) return null;

  return (
    <span className="absolute top-2 left-2 bg-gradient-to-r from-red-600 to-orange-500 text-white text-[15px] font-extrabold px-3 py-2 rounded-br-lg shadow-lg z-10 animate-pulse tracking-wide">
      🔥 -{discount}%
    </span>
  );
};

DiscountBadge.propTypes = {
  discount: PropTypes.number.isRequired,
};

export default DiscountBadge;
