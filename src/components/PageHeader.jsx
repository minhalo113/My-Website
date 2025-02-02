import React from 'react'
import { Link } from 'react-router-dom'

const PageHeader = ({title, curPage, additionalLink}) => {
    let additionalBreadcrumb = null;
    if (additionalLink && Array.isArray(additionalLink)) {
        additionalBreadcrumb = (
            additionalLink.map((value, index) => 
                <li key = {index} className='breadcrumb-item'>
                    <Link to={value.path}>{value.label}</Link>
                </li>
            ));
    } else {
        additionalBreadcrumb = null;
    }

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
                                <li className='breadcrumb-item'><Link to="/">Home</Link></li>
                                {additionalBreadcrumb}
                                <li className='breadcrumb-item active' aria-current = "page">{curPage}</li>
                            </ol>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
        </div>
  )
}

export default PageHeader