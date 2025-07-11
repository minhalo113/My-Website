import React from 'react'
import Link from 'next/link';
import PropTypes from 'prop-types';

const PageHeader = ({title, curPage, additionalLink}) => {
    let additionalBreadcrumb = null;
    if (additionalLink && Array.isArray(additionalLink)) {
        additionalBreadcrumb = (
            additionalLink.map((value, index) => 
                <li key = {index} className='breadcrumb-item'>
                    <Link href={value.path}>{value.label}</Link>
                </li>
            ));
    } else {
        additionalBreadcrumb = null;
    }

    const truncate = (str, maxLength) => str.length > maxLength ? str.slice(0, maxLength) + '...' : str;

  return (
    <div className='pageheader-section'>
        <div className="container">
            <div className="row">
                <div className="col-12">
                    <div className='pageheader-content text-center'>
                        <h2>
                            {title}
                        </h2>
                        <nav aria-label='breadcrumb'>
                            <ol className='breadcrumb justify-content-center'>
                                <li className='breadcrumb-item'><Link href="/">Home</Link></li>
                                {additionalBreadcrumb}
                                <li className='breadcrumb-item active' aria-current = "page">{truncate(curPage, 30)}</li>
                            </ol>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
        </div>
  )
}

PageHeader.propTypes = {
    title: PropTypes.string.isRequired,
    curPage: PropTypes.string.isRequired,
    additionalLink: PropTypes.arrayOf(
        PropTypes.shape({
            label:PropTypes.string.isRequired,
            path: PropTypes.string.isRequired
        })
    )
}

export default PageHeader