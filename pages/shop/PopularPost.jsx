import React from 'react'
import Link from 'next/link'

const title = "Most Recent Post"

const postList = [ 
    { id:1, imgUrl: '/images/blog/10.jpg', imgAlt: 'rajibraj91', title: 'sfs', date: 'Jun 05,2022', }, 
    { id:2, imgUrl: '/images/blog/11.jpg', imgAlt: 'rajibraj91', title: 'sdfsf', date: 'Jun 05,2022', }, 
    { id:3, imgUrl: '/images/blog/12.jpg', imgAlt: 'rajibraj91', title: 'sfdf', date: 'Jun 05,2022', }, 
    { id:4, imgUrl: '/images/blog/09.jpg', imgAlt: 'rajibraj91', title: 'Psfs', date: 'Jun 05,2022', }, ]

const PopularPost = () => {
  return (
    <div className='widget widget-post'>
        <div className='widget-header'>
            <h5 className='title'>{title}</h5>
        </div>

        <ul className='widget-wrapper'>
            {
                postList.map((blog, i) => (
                    <li key = {i} className='d-flex flex-wrap justify-content-between'>
                        <div className='post-thumb'>
                            <Link href = {`/blog/${blog.id}`}><img src = {blog.imgUrl} alt = ""/></Link>
                        </div>
                        <div className='post-content'>
                            <Link href = {`/blog/${blog.id}`}><h5>{blog.title}</h5></Link>
                            <p>
                                {blog.date}
                            </p>
                        </div>
                    </li>
                ))
            }
        </ul>
    </div>
  )
}

export default PopularPost