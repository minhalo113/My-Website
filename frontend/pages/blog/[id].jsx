import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router';
import PageHeader from '../../components/PageHeader';
import PopularPost from '../shop/PopularPost';
import Tags from '../shop/Tags';
import api from '../../src/api/api';
import { toast } from 'react-hot-toast';

const SingleBlog = () => {
    const [blog, setBlog] = useState([]);
    const [adjacentBlogs, setAdjacentBlogs] = useState({ prev: null, next: null });

    const router = useRouter();
    const {id} = router.query;

    const fetchData = async (id) => {
        try {
            const response = await api.get(`/get_blog/${id}`, {
            withCredentials: true
            });
    
            setBlog([response.data.blog]);
            console.log('Fetched blogs:', response.data.blog);
        } catch (err) {
            console.log('Error fetching blogs:', err);
        }
        };
    
    const fetchAdjacent = async(id) => {
        try{
            const { data } = await api.get(`/blog/adjacent/${id}`, { withCredentials: true });
            setAdjacentBlogs(data);
        }catch(err){
            console.log('Failed to fetch adjacent blogs:', err.response?.data?.message || err.message);
        }
    }

    useEffect(() => {
        if(!id) return;
        fetchData(id);
        fetchAdjacent(id)

      }, [id]);    

      if (!blog) return <p>Loading blog...</p>;

  return (
    <div>
        <PageHeader title = {"Single Blog Pages"} curPage = {"Blog Details"} additionalLink={[{label: "Blog", path : "/blog"}]}/>

        <div className='blog-section blog-single padding-tb section-bg'>
            <div className='container'>
                <div className="row justify-content-center">
                    <div className='col-lg-8 col-12'>
                        <article>
                            <div className='section-wrapper'>
                                <div className="row row-cols-1 justify-content-center g-4">
                                    <div className='col'>
                                        <div className='post-item style-2'>
                                            <div className="post-inner">
                                                {
                                                    blog.map((item) => (
                                                        <div key = {item._id}>
                                                            <div className='post-thumb'>
                                                                <img src = {item.image.url} alt = "" className='w-100'/>
                                                            </div>

                                                            <div className='post-content'>
                                                                <h3>{item.title}</h3>
                                                                <span>
                                                                🕓 Created: {new Date(item.createdAt).toLocaleString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                                </span>
                                                                <span style={{ marginLeft: '1rem' }}>
                                                                🔄 Updated: {new Date(item.updatedAt).toLocaleString('en-US', {
                                                                    year: 'numeric',
                                                                    month: 'short',
                                                                    day: 'numeric',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                                </span>

                                                                <div className='meta-post'>
                                                                    <ul className='lab-ul'>
                                                                        {
                                                                            item.metaList.map((val, i) => (
                                                                                <li key = {i}><i className={val.iconName}></i>{val.text}</li>
                                                                            ))
                                                                        }
                                                                    </ul>
                                                                </div>

                                                                <p style={{ whiteSpace: 'pre-wrap' }}>{item.content}</p>
                                                                
                                                                {
                                                                    item.blockquote && item.citation ? 
                                                                    <blockquote>
                                                                        <p>{item.blockquote}</p>
                                                                        <cite>{item.citation}</cite>
                                                                    </blockquote> : <></>
                                                                }
                                                                
                                                                {
                                                                    item.youtubeThumbnail.url && item.youtubeLink ? 
                                                                    <div className='video-thumb'>
                                                                        <img src ={item.youtubeThumbnail.url} alt = ""/>
                                                                        <a href={item.youtubeLink} target="_blank" rel="noopener noreferrer" className='video-button popup'>
                                                                            <i className='icofont-ui-play'></i>
                                                                        </a>
                                                                    </div> : <></>
                                                                }
                                                            
                                                                <div className='tags-section'>
                                                                    <ul className='tags lab-ul'>
                                                                        {
                                                                            item.tags.map((tag, index) => (
                                                                            <li key = {index}>
                                                                                <a href = "#">{tag}</a>
                                                                            </li>
                                                                            ))
                                                                        }
                                                                    </ul>

                                                                    {/* <ul className='lab-ul social-icons'>
                                                                        {
                                                                            socialList.map((val, i) => (
                                                                                <li key = {i}>
                                                                                    <a href = "#" className={val.iconName}>
                                                                                        <i className={val.iconName}></i>
                                                                                    </a>
                                                                                </li>
                                                                            ))
                                                                        }
                                                                    </ul> */}
                                                                </div> 
                                                            </div>
                                                        </div>
                                                    ))
                                                }
                                            </div>
                                        </div>
                                        <div className='navigations-part'>
                                            <div className='left'>
                                                {adjacentBlogs.prev ? (
                                                <>
                                                    <a href={`/blog/${adjacentBlogs.prev._id}`} className='prev'>
                                                    <i className='icofont-double-left'></i> Previous Blog
                                                    </a>
                                                    <a href={`/blog/${adjacentBlogs.prev._id}`} className='title'>
                                                    {adjacentBlogs.prev.title}
                                                    </a>
                                                </>
                                                ) : (
                                                <p>No previous blog</p>
                                                )}
                                            </div>

                                            <div className='right'>
                                                {adjacentBlogs.next ? (
                                                <>
                                                    <a href={`/blog/${adjacentBlogs.next._id}`} className='prev'>
                                                    <i className='icofont-double-right'></i> Later Blog
                                                    </a>
                                                    <a href={`/blog/${adjacentBlogs.next._id}`} className='title'>
                                                    {adjacentBlogs.next.title}
                                                    </a>
                                                </>
                                                ) : (
                                                <p>No later blog</p>
                                                )}
                                            </div>
                                            </div>
                                    </div>
                                </div>
                            </div>
                        </article>
                    </div>

                    <div className='col-lg-4 col-12'>
                        <aside>
                            {/* <Tags/> */}
                            <PopularPost/>
                        </aside>
                    </div>
                </div>
            </div>
        </div>

    </div>
    )
}

export default SingleBlog