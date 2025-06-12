import React from 'react'
import PageHeader from "../../components/PageHeader"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import api from '../../src/api/api';

export const Blog = () => {
  const [blogList, setBlogList] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get('/get_blogs', {
          withCredentials: true
        });
  
        setBlogList(response.data.blogs);
        console.log('Fetched blogs:', response.data.blogs);
      } catch (err) {
        console.error('Error fetching blogs:', err);
      }
    };
  
    fetchData();
  }, []);  

  return (
    <div>
      <PageHeader title = "Blog Page" curPage="Blogs"/>
      <div className='blog-section padding-tb section-bg'>
        <div className='container'>
          <div className='section-wrapper'>
            <div className='row row-cols-1 row-cols-md-2 row-cols-xl-3 justify-content-center g-4'>
              {
                blogList.map((blog, i) => (
                  <div key = {i} className='col'>
                    <div className='post-item'>
                      <div className='post-inner'>

                        <div className='post-thumb'>
                          <Link href = {`/blog/${blog._id}`}>
                            <img src = {blog.image.url} alt = ""/>
                          </Link>
                        </div>

                        <div className='post-content'>
                          <Link href = {`/blog/${blog._id}`}><h4>{blog.title}</h4></Link>
                          <div className='meta-post'>
                            <ul className='lab-ul'>
                              {
                                blog.metaList.map((val, i) => {
                                  <li key = {i}>
                                    <i className= {val.iconName}></i> {val.text}
                                  </li>
                                })
                              }
                            </ul>
                          </div>
                          <p>
                            {blog.desc}
                          </p>
                        </div>

                        <div className='post-footer'>
                          <div className='pf-left'>
                            <Link href ={`/blog/${blog._id}`} className='lab-btn-text'>{blog.btnText}
                              <i className='icofont-external-link'></i>
                            </Link>
                          </div>

                          {/* <div className='pf-right'>
                            <i className='icofont-comment'></i>
                            <span className='comment-count'>{blog.commentCount}</span>
                          </div> */}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Blog