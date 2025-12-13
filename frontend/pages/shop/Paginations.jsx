import PropTypes from 'prop-types';
import React from 'react';

const Paginations = ({productsPerPage, totalProducts, paginate, activePage}) => {
  const totalPages = Math.ceil(totalProducts / productsPerPage);

  if (totalPages <= 1) {
    return null;
  }

  const maxVisibleNumbers = 7;

  const goToPage = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === activePage) {
      return;
    }

    paginate(pageNumber);
  };

  let startPage = 1;
  let endPage = totalPages;

  if (totalPages > maxVisibleNumbers) {
    const middleOffset = Math.floor(maxVisibleNumbers / 2);
    startPage = activePage - middleOffset;
    endPage = activePage + middleOffset;

    if (startPage < 1) {
      startPage = 1;
      endPage = maxVisibleNumbers;
    } else if (endPage > totalPages) {
      endPage = totalPages;
      startPage = totalPages - maxVisibleNumbers + 1;
    }
  }

  const visiblePages = [];
  for (let page = startPage; page <= endPage; page += 1) {
    visiblePages.push(page);
  }

  const showLeftEllipsis = startPage > 2;
  const showRightEllipsis = endPage < totalPages - 1;

  return (
    <ul className='default-pagination lab-ul'>
      <li>
        <a
          href='#'
          onClick={(event) => {
            event.preventDefault();
            goToPage(1);
          }}
          className={activePage === 1 ? 'disabled' : ''}
          aria-disabled={activePage === 1}
        >
          «
        </a>
      </li>
      <li>
        <a
          href='#'
          onClick={(event) => {
            event.preventDefault();
            goToPage(activePage - 1);
          }}
          className={activePage === 1 ? 'disabled' : ''}
          aria-disabled={activePage === 1}
        >
          <i className='icofont-rounded-left'></i>
        </a>
      </li>
      {showLeftEllipsis && (
        <li className='ellipsis'>
          <a
            href=''
            className={`page-item`}
            onClick={(e) => e.preventDefault()}
          >
            ...
          </a>
        </li>
      )}
      {visiblePages.map((pageNumber) => (
        <li key={pageNumber}>
          <a
            href='#'
            onClick={(event) => {
              event.preventDefault();
              goToPage(pageNumber);
            }}
            className={`page-item ${pageNumber === activePage ? 'bg-button-color' : ''}`}
            aria-current={pageNumber === activePage ? 'page' : undefined}
          >
            {pageNumber}
          </a>
        </li>
      ))}
      {showRightEllipsis && (
        <li className='ellipsis'>
          <a
            href=''
            className={`page-item`}
            onClick={(e) => e.preventDefault()}
          >
                     ...
          </a>
        </li>
      )}
      <li>
        <a
          href='#'
          onClick={(event) => {
            event.preventDefault();
            goToPage(activePage + 1);
          }}
          className={activePage === totalPages ? 'disabled' : ''}
          aria-disabled={activePage === totalPages}
        >
          <i className='icofont-rounded-right'></i>
        </a>
      </li>
      <li>
        <a
          href='#'
          onClick={(event) => {
            event.preventDefault();
            goToPage(totalPages);
          }}
          className={activePage === totalPages ? 'disabled' : ''}
          aria-disabled={activePage === totalPages}
        >
          »
        </a>
      </li>
    </ul>
  );
};

Paginations.propTypes = {
  productsPerPage: PropTypes.number.isRequired,
  totalProducts: PropTypes.number.isRequired,
  paginate: PropTypes.func.isRequired,
  activePage: PropTypes.number.isRequired,
};

Paginations.defaultProps = {
  productsPerPage: 10,
  totalProducts: 0,
  activePage: 1,
};

export default Paginations;