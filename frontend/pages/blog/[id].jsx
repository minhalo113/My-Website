import React from 'react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router';
import PageHeader from '../../components/PageHeader';
import PopularPost from '../shop/PopularPost';
import Tags from '../shop/Tags';

const SingleBlog = () => {
    const [blog, setBlog] = useState([]);

    useEffect(() => {
        fetch("/utilis/blogdata.json")
        .then(res => res.json())
        .then(data => {setBlog(data)})
        .catch(error => console.error("Error fetching prodcuts:", error))
    }, [])
    const router = useRouter();
    const {id} = router.query;

    const result = blog.filter((b) => b.id === Number(id));
    console.log(id)

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
                                                    result.map((item) => (
                                                        <div key = {item.id}>
                                                            <div className='post-thumb'>
                                                                <img src = {item.imgUrl} alt = "" className='w-100'/>
                                                            </div>

                                                            <div className='post-content'>
                                                                <h3>{item.title}</h3>
                                                                <div className='meta-post'>
                                                                    <ul className='lab-ul'>
                                                                        {
                                                                            item.metaList.map((val, i) => (
                                                                                <li key = {i}><i className={val.iconName}></i>{val.text}</li>
                                                                            ))
                                                                        }
                                                                    </ul>
                                                                </div>

                                                                <p>{item.content}</p>

                                                                <blockquote>
                                                                    <p>{item.blockquote}</p>
                                                                    <cite>{item.citation}</cite>
                                                                </blockquote>

                                                                <div className='video-thumb'>
                                                                    <img src ={item.youtubeThumbnail} alt = ""/>
                                                                    <a href={item.youtubeLink} target="_blank" rel="noopener noreferrer" className='video-button popup'>
                                                                        <i className='icofont-ui-play'></i>
                                                                    </a>
                                                                </div>
                                                            
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
                                                    <a href = "#" className='prev'>
                                                        <i className='icofont-double-left'></i> Previous Blog
                                                    </a>

                                                    <a href = "#" className='title'>
                                                        This is The Previous Blog
                                                    </a>
                                                </div>

                                                <div className='right'>
                                                    <a href = "#" className='prev'>
                                                        <i className='icofont-double-right'></i> Later Blog
                                                    </a>

                                                    <a href = "#" className='title'>
                                                        This is The Later Blog
                                                    </a>
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