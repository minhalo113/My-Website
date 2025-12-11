import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';
import PageHeader from '../../components/PageHeader';
import PopularPost from '../shop/PopularPost';
import RelatedProducts from '../shop/RelatedProducts.jsx';
import api from '../../src/api/api';
import { toast } from 'react-hot-toast';
import SEO from '../../components/SEO';
import { ensureHttps } from '../../src/utils/imageUtils';

const extractStartTime = (searchParams) => {
    if (!searchParams) return '';

    const raw = searchParams.get('start') || searchParams.get('t');
    if (!raw) return '';

    if (/^\d+$/.test(raw)) {
        return raw;
    }

    const pattern = /(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s?)?/i;
    const matches = raw.match(pattern);

    if (!matches) return '';

    const hours = parseInt(matches[1] || '0', 10);
    const minutes = parseInt(matches[2] || '0', 10);
    const seconds = parseInt(matches[3] || '0', 10);

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return totalSeconds > 0 ? String(totalSeconds) : '';
};

const getYoutubeEmbedUrl = (url) => {
    if (!url || typeof url !== 'string') return '';

    try {
        const trimmedUrl = url.trim();
        const parsedUrl = new URL(trimmedUrl);
        const hostname = parsedUrl.hostname.replace('www.', '');
        const startTime = extractStartTime(parsedUrl.searchParams);
        const startQuery = startTime ? `?start=${startTime}` : '';

        if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
            if (parsedUrl.pathname.startsWith('/embed/')) {
                const search = parsedUrl.search || startQuery;
                return `https://www.youtube.com${parsedUrl.pathname}${search}`;
            }

            if (parsedUrl.pathname.startsWith('/shorts/')) {
                const videoId = parsedUrl.pathname.split('/')[2];
                return videoId ? `https://www.youtube.com/embed/${videoId}${startQuery}` : '';
            }

            const videoId = parsedUrl.searchParams.get('v');
            return videoId ? `https://www.youtube.com/embed/${videoId}${startQuery}` : '';
        }

        if (hostname === 'youtu.be') {
            const videoId = parsedUrl.pathname.replace('/', '');
            return videoId ? `https://www.youtube.com/embed/${videoId}${startQuery}` : '';
        }

        return '';
    } catch (error) {
        return '';
    }
};

const SingleBlog = () => {
    const [blog, setBlog] = useState(null);
    const [adjacentBlogs, setAdjacentBlogs] = useState({ prev: null, next: null });
    const [comments, setComments] = useState([]);
    const [loadingComments, setLoadingComments] = useState(false);
    const [commentError, setCommentError] = useState('');
    const [formValues, setFormValues] = useState({ name: '', email: '', message: '' });
    const [submitting, setSubmitting] = useState(false);
    const [moderationNotice, setModerationNotice] = useState('');

    const router = useRouter();
    const { id } = router.query;
    const embedUrl = blog?.youtubeLink ? getYoutubeEmbedUrl(blog.youtubeLink) : '';
    const fetchData = useCallback(async (blogId) => {
        try {
            const response = await api.get(`/get_blog/${blogId}`, {
                withCredentials: true
            });
            setBlog(response.data.blog);
        } catch (err) {
            const message = err.response?.data?.message || 'Error fetching the blog.';
            toast.error(message);
        }
    }, []);

    const fetchAdjacent = useCallback(async (blogId) => {
        try {
            const { data } = await api.get(`/blog/adjacent/${blogId}`, { withCredentials: true });
            setAdjacentBlogs(data);
        } catch (err) {
            const message = err.response?.data?.message || err.message;
            console.error('Failed to fetch adjacent blogs:', message);
        }
    }, []);

    const fetchComments = useCallback(async (blogId) => {
        try {
            setLoadingComments(true);
            setCommentError('');
            const { data } = await api.get(`/blog/${blogId}/comments`);
            setComments(Array.isArray(data.comments) ? data.comments : []);
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to load comments.';
            setCommentError(message);
        } finally {
            setLoadingComments(false);
        }
    }, []);

    useEffect(() => {
        if (!id) return;
        fetchData(id);
        fetchAdjacent(id);
        fetchComments(id);
    }, [id, fetchAdjacent, fetchComments, fetchData]);

    const handleInputChange = (event) => {
        const { name, value } = event.target;
        setFormValues((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setModerationNotice('');

        const trimmedName = formValues.name.trim();
        const trimmedEmail = formValues.email.trim();
        const trimmedMessage = formValues.message.trim();

        if (!trimmedName || !trimmedEmail || !trimmedMessage) {
            toast.error('Please complete all fields before submitting your comment.');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(trimmedEmail)) {
            toast.error('Please provide a valid email address.');
            return;
        }

        if (!id) {
            toast.error('Unable to determine the blog post.');
            return;
        }

        setSubmitting(true);
        try {
            const { data } = await api.post(`/blog/${id}/comments`, {
                name: trimmedName,
                email: trimmedEmail,
                message: trimmedMessage
            });

            if (data?.comment) {
                if (data.comment.status === 'approved') {
                    setComments((prev) => [data.comment, ...prev]);
                    setBlog((prev) => prev ? {
                        ...prev,
                        commentCount: (prev.commentCount || 0) + 1
                    } : prev);
                    toast.success(data?.message || 'Your comment has been posted.');
                } else {
                    setModerationNotice(data?.message || 'Thank you! Your comment is awaiting moderation.');
                }
            } else if (data?.message) {
                setModerationNotice(data.message);
            }

            setFormValues({ name: '', email: '', message: '' });
        } catch (err) {
            const message = err.response?.data?.message || err.message || 'Failed to submit your comment.';
            toast.error(message);
        } finally {
            setSubmitting(false);
        }
    };

    const renderComments = () => {
        if (loadingComments) {
            return <p>Loading comments...</p>;
        }

        if (commentError) {
            return <p className="text-danger">{commentError}</p>;
        }

        if (!comments.length) {
            return <p>No comments yet. Be the first to share your thoughts!</p>;
        }

        return (
            <ul className="lab-ul">
                {comments.map((comment) => (
                    <li key={comment._id} className="mb-4">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                            <h6 className="mb-0">{comment.name}</h6>
                            <span className="text-muted small">
                                {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                }) : ''}
                            </span>
                        </div>
                        <p className="mb-1" style={{ whiteSpace: 'pre-wrap' }}>{comment.message}</p>
                        {comment.isEdited && (
                            <span className="badge bg-light text-dark">Edited</span>
                        )}
                    </li>
                ))}
            </ul>
        );
    };

    const commentCountLabel = `${comments.length} Comment${comments.length === 1 ? '' : 's'}`;

    const blogUrl = `https://www.afigureaday.com/blog/${blog?._id || ''}`
    const description =
        blog?.blogDetail?.summary ||
        blog?.title ||
        'Read the latest article from A Figure A Day.'
    const image = blog?.image?.url || '/images/logo/myLogoResize.png'

    return (
        <div>
            <SEO
                title={`${blog?.title || 'Blog'} | A Figure A Day`}
                description={description}
                canonical={blogUrl}
                image={image}
            />
            <PageHeader title={"Single Blog Pages"} curPage={"Blog Details"} additionalLink={[{ label: "Blog", path: "/blog" }]} />

            <div className='blog-section blog-single padding-tb section-bg'>
                <div className='container'>
                    <div className="row justify-content-center">
                        <div className='col-lg-8 col-12'>
                            <article>
                                {blog ? (
                                    <div className='section-wrapper'>
                                        <div className="row row-cols-1 justify-content-center g-4">
                                            <div className='col'>
                                                <div className='post-item style-2'>
                                                    <div className="post-inner">
                                                        <div className='post-thumb'>
                                                            {blog.image?.url && (
                                                                <Image
                                                                    src={ensureHttps(blog.image.url)}
                                                                    alt={blog.title}
                                                                    width={800}
                                                                    height={400}
                                                                    className='w-100'
                                                                    style={{ width: '100%', height: 'auto' }}
                                                                />
                                                            )}
                                                        </div>

                                                        <div className='post-content'>
                                                            <h3>{blog.title}</h3>
                                                            <div className='d-flex flex-wrap gap-3 text-muted mb-3'>
                                                                <span>
                                                                    🕓 Created: {blog.createdAt ? new Date(blog.createdAt).toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    }) : 'N/A'}
                                                                </span>
                                                                <span>
                                                                    🔄 Updated: {blog.updatedAt ? new Date(blog.updatedAt).toLocaleDateString('en-US', {
                                                                        year: 'numeric',
                                                                        month: 'short',
                                                                        day: 'numeric'
                                                                    }) : 'N/A'}
                                                                </span>
                                                                <span>💬 {commentCountLabel}</span>
                                                            </div>

                                                            {Array.isArray(blog.metaList) && blog.metaList.length > 0 && (
                                                                <div className='meta-post'>
                                                                    <ul className='lab-ul'>
                                                                        {blog.metaList.map((val, i) => (
                                                                            <li key={i}>
                                                                                <i className={val.iconName}></i>{val.text}
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}

                                                            <p style={{ whiteSpace: 'pre-wrap' }}>{blog.content}</p>

                                                            {blog.blockquote && blog.citation && (
                                                                <blockquote>
                                                                    <p>{blog.blockquote}</p>
                                                                    <cite>{blog.citation}</cite>
                                                                </blockquote>
                                                            )}

                                                            {embedUrl && (
                                                                <div className='video-thumb'>
                                                                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px' }}>
                                                                        <iframe
                                                                            src={embedUrl}
                                                                            title={blog.title || 'YouTube video player'}
                                                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                                                                            allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
                                                                            allowFullScreen
                                                                        ></iframe>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {Array.isArray(blog.tags) && blog.tags.length > 0 && (
                                                                <div className='tags-section'>
                                                                    <ul className='tags lab-ul'>
                                                                        {blog.tags.map((tag, index) => (
                                                                            <li key={index}>
                                                                                <a href="#">{tag}</a>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                        </div>
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
                                ) : (
                                    <p>Loading blog...</p>
                                )}

                                <div className='comment-area mt-5'>
                                    <h4 className='mb-4'>{commentCountLabel}</h4>
                                    {renderComments()}
                                </div>

                                <div className='comment-form mt-5'>
                                    <h4 className='mb-3'>Leave a Comment</h4>
                                    <p className='mb-4 text-muted'>Your email address will remain private. Required fields are marked.</p>
                                    <form className='row g-3' onSubmit={handleSubmit}>
                                        <div className='col-md-6'>
                                            <label className='form-label'>Display Name</label>
                                            <input
                                                type='text'
                                                name='name'
                                                className='form-control'
                                                placeholder='Your name'
                                                value={formValues.name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className='col-md-6'>
                                            <label className='form-label'>Email Address</label>
                                            <input
                                                type='email'
                                                name='email'
                                                className='form-control'
                                                placeholder='you@example.com'
                                                value={formValues.email}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>
                                        <div className='col-12'>
                                            <label className='form-label'>Comment</label>
                                            <textarea
                                                name='message'
                                                rows='5'
                                                className='form-control'
                                                placeholder='Share your thoughts...'
                                                value={formValues.message}
                                                onChange={handleInputChange}
                                                required
                                            ></textarea>
                                        </div>
                                        {moderationNotice && (
                                            <div className='col-12'>
                                                <div className='alert alert-info mb-0'>{moderationNotice}</div>
                                            </div>
                                        )}
                                        <div className='col-12'>
                                            <button type='submit' className='lab-btn' disabled={submitting}>
                                                <span>{submitting ? 'Submitting...' : 'Post Comment'}</span>
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </article>
                        </div>

                        <div className='col-lg-4 col-12'>
                            <aside>
                                <PopularPost />
                                {blog?.products && blog.products.length > 0 && (
                                    <RelatedProducts products={blog.products} />
                                )}
                            </aside>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default SingleBlog;
