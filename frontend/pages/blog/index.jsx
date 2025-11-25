import React from 'react'
import PageHeader from "../../components/PageHeader"
import Link from 'next/link'
import { useState, useEffect } from 'react'
import api from '../../src/api/api';
import SEO from "../../components/SEO";
import Paginations from '../shop/Paginations';

export const Blog = () => {
  const [blogList, setBlogList] = useState([])
  const [totalBlogs, setTotalBlogs] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const blogsPerPage = 30;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const response = await api.get('/get_blogs', {
          params: {
            parPage: blogsPerPage,
            page: currentPage,
            searchValue: '',
          },
          withCredentials: true
        });

        setBlogList(response.data.blogs || []);
        setTotalBlogs(response.data.totalBlogs || 0);
        console.log('Fetched blogs:', response.data.blogs);
      } catch (err) {
        setError('Error loading blogs. Please try again later.');
        console.log('Error fetching blogs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentPage, blogsPerPage]);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <div>
      <SEO
        title="Blog | A Figure A Day"
        description="Collector tips, figure spotlights, and news from A Figure A Day."
        canonical="https://www.afigureaday.com/blog"
        keywords="anime figure news, collectible tips, a figure a day blog"
      />
      <PageHeader title = "Blog Page" curPage="Blogs"/>
      <div className='blog-section padding-tb section-bg'>
        <div className='container'>
          <div className='section-wrapper'>
            {error && (
              <div className='alert alert-danger' role='alert'>{error}</div>
            )}
            {isLoading ? (
              <div className='py-4 text-center text-muted'>Loading blogs...</div>
            ) : (
              <>
                <div className='row row-cols-1 row-cols-md-2 row-cols-xl-3 justify-content-center g-4'>
                  {
                    blogList.length > 0 ? (
                      blogList.map((blog, i) => (
                        <div key = {i} className='col'>
                          <div className='post-item'>
                            <div className='post-inner'>

                              <div className='post-thumb'>
                                <Link href = {`/blog/${blog._id}`}>
                                  <img src = {blog.image?.url} alt = ""/>
                                </Link>
                              </div>

                              <div className='post-content'>
                                <Link href = {`/blog/${blog._id}`}><h4>{blog.title}</h4></Link>
                                <div className='meta-post'>
                                  <ul className='lab-ul'>
                                    {
                                      blog.metaList?.map((val, i) => (
                                        <li key = {i}>
                                          <i className= {val.iconName}></i> {val.text}
                                        </li>
                                      ))
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
                    ) : (
                      <div className='py-4 text-center text-muted'>No blogs available.</div>
                    )
                  }
                </div>
                <div className='d-flex justify-content-center mt-4'>
                  <Paginations
                    productsPerPage={blogsPerPage}
                    totalProducts={totalBlogs}
                    paginate={paginate}
                    activePage={currentPage}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Blog