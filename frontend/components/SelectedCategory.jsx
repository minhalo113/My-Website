import React from 'react';
import PropTypes from 'prop-types';

const SelectedCategory = ({ select, allCategorys, onChange }) => {
  return (
    <select value={select} onChange={onChange}>
      <option value="all">All Categories</option>
      {allCategorys.map((category, index) => (
        <option key={index} value={category.name}>
          {category.name}
        </option>
      ))}
    </select>
  );
};

SelectedCategory.propTypes = {
  select: PropTypes.string.isRequired,
  allCategorys: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired
};

export default SelectedCategory;
