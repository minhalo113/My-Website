import React from 'react'
import PropTypes from 'prop-types';

const ShopCategory = ({ filterItem, menuItems, selectedCategory, categoryFacets, totalProducts }) => {
  const categories = Array.isArray(categoryFacets) && categoryFacets.length
    ? categoryFacets
        .filter((facet) => facet && facet.value)
        .map((facet) => ({
          name: facet.value,
          count: Number(facet.count) || 0,
        }))
    : (menuItems || []).map((name) => ({ name, count: null }));

  const formattedTotal = Number.isFinite(Number(totalProducts)) ? Number(totalProducts).toLocaleString() : null;
  const scrollContainerStyle = {
    maxHeight: '200rem',
    overflowY: 'auto',
    paddingRight: '0.25rem',
  };
  return (
    <div className='widget'>
      <div className='widget-header'>
        <h4>All Categories</h4>
      </div>

      <div className='widget-wrapper' style={scrollContainerStyle}>
        <button onClick={() => filterItem('all')} className={`m-2 ${selectedCategory === 'all' ? 'bg-warning' : ''}`}>
          All{formattedTotal ? ` (${formattedTotal})` : ''}
        </button>
        {categories.map(({ name, count }) => {
          const isActive = selectedCategory === name;
          const displayCount = Number.isFinite(count) ? count.toLocaleString() : null;
          return (
            <button
              className={`m-2 ${isActive ? 'bg-warning' : ''}`}
              key={name}
              onClick={() => filterItem(name)}
            >
              {name}
              {displayCount ? ` (${displayCount})` : ''}
            </button>
          );
        })}
      </div>
    </div>
  );
};

ShopCategory.propTypes = {
  filterItem: PropTypes.func.isRequired,
  menuItems: PropTypes.arrayOf(PropTypes.string).isRequired,
  selectedCategory: PropTypes.string.isRequired,
  categoryFacets: PropTypes.arrayOf(PropTypes.shape({
    value: PropTypes.string,
    count: PropTypes.number,
  })),
  totalProducts: PropTypes.number,
};

ShopCategory.defaultProps = {
  categoryFacets: [],
  totalProducts: 0,
};

export default ShopCategory;