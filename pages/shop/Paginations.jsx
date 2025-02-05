import PropTypes from 'prop-types';
import React from 'react'

const Paginations = ({productsPerPage, totalProducts, paginate, activePage}) => {
  const pageNumbers = [];
  for(let i = 1; i <= Math.ceil(totalProducts/productsPerPage); i++){
    pageNumbers.push(i)
  }
  return (
    <ul className='default-pagination lab-ul'>
      <li>
        <a href = "#" onClick = {() => {
          if(activePage < pageNumbers.length){
            paginate(activePage - 1)
          }
        }}><i className='icofont-rounded-left'></i> 
        </a>
      </li>
      {
        pageNumbers.map((number) => (
          <li key={number}>
            <a onClick={() => paginate(number)}  className={`page-item ${number ===activePage ? "bg-button-color": ""}`}>{number}</a>
          </li>
        ))
      }
      <li>
        <a href = "#" onClick = {() => {
          if(activePage < pageNumbers.length){
            paginate(activePage + 1)
          }
        }}><i className='icofont-rounded-right'></i> 
        </a>
      </li>
    </ul>
  )
}

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

export default Paginations
