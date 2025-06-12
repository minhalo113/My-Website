import React from 'react'
import Link from 'next/link'
import { useState, useEffect } from 'react';
import api from './../../src/api/api';

const title = "Most Recent Post"

const PopularPost = () => {
    const [postList, setPostList] = useState([])

    const fetchData = async() => {
        try{
            const {data} = await api.get('/recent-blogs', {withCredentials: true});
            setPostList(data.blogs)
        }catch(error){
            console.log(error.response.data.message || "Something went wrong")
        }
    }

    useEffect(() => {
        fetchData();
    }, [])

  return (
    <div className='widget widget-post'>
        <div className='widget-header'>
            <h5 className='title'>{title}</h5>
        </div>

        <ul className='widget-wrapper'>
        {postList.map((blog, i) => (
            <li key={blog._id || i} className="d-flex gap-3 mb-4">
                <div className="post-thumb rounded overflow-hidden shadow-sm">
                <Link href={`/blog/${blog._id}`}>
                    <img
                    src={blog.image?.url || "/images/default-thumb.jpg"}
                    alt={blog.title}
                    className="w-[90px] h-[90px] object-cover"
                    />
                </Link>
                </div>

                <div className="post-content flex-1">
                <Link href={`/blog/${blog._id}`}>
                    <h5 className="text-lg font-semibold hover:underline text-gray-800">{blog.title}</h5>
                </Link>
                <p className="text-sm text-gray-500 mt-1">
                    🕒 {new Date(blog.createdAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                    })}
                </p>
                </div>
            </li>
            ))}
        </ul>
    </div>
  )
}

export default PopularPost