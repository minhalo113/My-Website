import formidable from 'formidable';
import responseReturn from '../../utils/response.js';
import { v2 as cloudinary } from 'cloudinary';
import blogModel from "../../models/blogModel.js"
import slugify from 'slugify'
import { generateBlogEnhancement } from './../../services/aiBlogService.js';
import mongoose from 'mongoose';
import { evaluateCommentModeration } from './../../utils/moderation.js';

class blogController{
    add_blog = async(req, res) => {
        try{
            const form = formidable({});
            form.parse(req, async(err, fields, files) => {
                if (err) {
                    return responseReturn(res, 400, {
                        message: 'Form parsing failed',
                        error: err.message,
                    });
                }
                
                try{
                    let {title, content, description, blockQuote, youtubeLink, citation, tags} = fields
                    
                    title = Array.isArray(title) ? title[0] : title;
                    content = Array.isArray(content) ? content[0] : content;
                    description = Array.isArray(description) ? description[0] : description;
                    blockQuote = Array.isArray(blockQuote) ? blockQuote[0] : blockQuote;
                    youtubeLink = Array.isArray(youtubeLink) ? youtubeLink[0] : youtubeLink;
                    citation = Array.isArray(citation) ? citation[0] : citation;
                    tags = Array.isArray(tags) ? tags[0] : tags;
                    
                    title = title.trim();
                    content = content.trim();
                    description = description.trim();
                    blockQuote = blockQuote.trim();
                    youtubeLink = youtubeLink.trim();
                    citation = citation.trim();
                    tags = tags.trim().split(',').map((t) => t.trim());
                    
                    const slug = slugify(title, { lower: true })
                    
                    cloudinary.config({
                        cloud_name: process.env.cloud_name,
                        api_key: process.env.api_key,
                        api_secret: process.env.api_secret,
                        secure: true
                    })
                    let imageResult = null;
                    let youtubeThumbResult = null;
            
                    let blog_image = Array.isArray(files.image) ? files.image[0] : files.image;
                    let youtube_image = Array.isArray(files.youtubeThumbnail) ? files.youtubeThumbnail[0] : files.youtubeThumbnail;

                    if (files.image) {
                        imageResult = await cloudinary.uploader.upload(blog_image.filepath, {
                            folder: 'blogs/images',
                        });
                    }
                    
                    if (files.youtubeThumbnail) {
                        youtubeThumbResult = await cloudinary.uploader.upload(youtube_image.filepath, {
                            folder: 'blogs/thumbnails',
                        });
                    }
                    
                    const blog = new blogModel({
                        image: {
                            url: imageResult?.url || '',
                            publicId: imageResult?.public_id || ''
                        },
                        title, desc: description, content, slug, blockquote: blockQuote, citation,
                        youtubeThumbnail: {
                            url: youtubeThumbResult?.url || '',
                            publicId: youtubeThumbResult?.public_id || ''
                        },
                        youtubeLink,
                        tags,
                    })
                    
                    await blog.save();
                    return responseReturn(res, 201, {
                        message: 'Blog added successfully',
                        blog,
                    });
                }catch(innerErr){
                    return responseReturn(res, 500, {
                        message: innerErr.message,
                        error: innerErr.message
                    })
                }
            });

        }catch(err){
            return responseReturn(res, 500, {message: err.message, error: err.message})
        }
    }

    delete_blog = async(req, res) => {
        try{
            const {id} = req.params;

            const blog = await blogModel.findById(id);
            if(!blog){
                return responseReturn(res, 404, {message: "Blog not found"});
            }

            if (blog.image?.publicId){
                await cloudinary.uploader.destroy(blog.image.publicId);
            }
            if(blog.youtubeThumbnail?.publicId){
                await cloudinary.uploader.destroy(blog.youtubeThumbnail.publicId);
            }
            await blogModel.findByIdAndDelete(id);

            return responseReturn(res, 200, {message: "Blog deleted successfully"})
        }catch(err){
            return responseReturn(res, 500, {message: err.message});
        }
    }

    get_blog = async(req, res) => {
        try{
            const {id} = req.params;
            const blog = await blogModel.findById(id);

            if (!blog) {
                return responseReturn(res, 404, {message: 'Blog not found'});
            }

            const blogData = blog.toObject ? blog.toObject() : blog;
            if (Array.isArray(blogData.comments)) {
                blogData.comments = blogData.comments
                    .filter((comment) => comment.status === 'approved')
                    .map(({ email, ...rest }) => rest);
            }

            return responseReturn(res, 200, {blog: blogData})
        }catch(err){
            return responseReturn(res, 500, {message: err.message});
        }
    }

    get_blogs = async(req, res) => {
        let {parPage, page, searchValue} = req.query;
        parPage = parPage === 'null' ? null : parseInt(parPage);
        page = page === 'null' ? null : parseInt(page);
        searchValue = searchValue === 'null' ? null : searchValue;

        try{
            let skipPage = ''
            if (parPage && page){
                skipPage = parPage * (page - 1);
            }

            if (searchValue && page && parPage){
                const blogs = await blogModel.find({
                    $text: {$search: searchValue}
                }).skip(skipPage).limit(parPage).sort({createdAt: -1})

                const totalBlogs = await blogModel.find({
                    $text: {$search: searchValue}
                }).countDocuments()
                return responseReturn(res, 200, {blogs, totalBlogs})
            }else if(searchValue === '' && page && parPage){
                const blogs = await blogModel.find().skip(skipPage).limit(parPage).sort({createdAt: -1});
                const totalBlogs = await blogModel.find().countDocuments();
                return responseReturn(res, 200, {blogs, totalBlogs});
            }else{
                const blogs = await blogModel.find().sort({createdAt: -1});
                const totalBlogs = await blogModel.find().countDocuments();
                return responseReturn(res, 200, {blogs, totalBlogs});
            }

        }catch(err){    
            return responseReturn(res, 500, {message: err.message, error: err.message})
        }
    }

    automate_create_blog = async(req, res) => {
        try{
            const { title, content, instructions } = req.body || {};

            const trimmedTitle = typeof title === 'string' ? title.trim() : '';
            const trimmedContent = typeof content === 'string' ? content.trim() : '';

            if(!trimmedTitle || !trimmedContent){
                return responseReturn(res, 400, { message: 'Title and content are required to generate AI suggestions' });
            }

            const aiResult = await generateBlogEnhancement({
                title: trimmedTitle,
                content: trimmedContent,
                instructions,
            });

            return responseReturn(res, 200, {
                message: 'AI blog suggestions generated successfully',
                blog: aiResult,
            });
        }catch(err){
            console.error('Failed to automate blog creation', err);
            const errorMessage = err?.response?.data?.message || err?.response?.data?.error?.message || err?.message || 'Failed to generate AI blog content';
            return responseReturn(res, 500, {
                message: errorMessage,
            });
        }
    }

    update_blog = async(req, res) => {
        try{
            const form = formidable({});
            form.parse(req, async(err, fields, files) => {
                if(err) {
                    return responseReturn(res, 400, {
                        message: "Form passing failed",
                        error: err.message,
                    });
                }
    
                try{
                    let {id, title, content, description, blockQuote, youtubeLink, citation, tags} = fields
                    
                    const blog = await blogModel.findById(id);
                    if(!blog){
                        return responseReturn(res, 404, {message: "Blog not found"})
                    }

                    title = Array.isArray(title) ? title[0] : title;
                    content = Array.isArray(content) ? content[0] : content;
                    description = Array.isArray(description) ? description[0] : description;
                    blockQuote = Array.isArray(blockQuote) ? blockQuote[0] : blockQuote;
                    youtubeLink = Array.isArray(youtubeLink) ? youtubeLink[0] : youtubeLink;
                    citation = Array.isArray(citation) ? citation[0] : citation;
                    tags = Array.isArray(tags) ? tags[0] : tags;
                    
                    title = title.trim();
                    content = content.trim();
                    description = description.trim();
                    blockQuote = blockQuote.trim();
                    youtubeLink = youtubeLink.trim();
                    citation = citation.trim();
                    tags = tags.trim().split(',').map((t) => t.trim());
                    
                    const slug = slugify(title, { lower: true })

                    cloudinary.config({
                        cloud_name: process.env.cloud_name,
                        api_key: process.env.api_key,
                        api_secret: process.env.api_secret,
                        secure: true
                    })

                    let blog_image = Array.isArray(files.image) ? files.image[0] : files.image;
                    let youtube_image = Array.isArray(files.youtubeThumbnail) ? files.youtubeThumbnail[0] : files.youtubeThumbnail;

                    let newImage = blog.image;
                    let newYoutubeThumb = blog.youtubeThumbnail;

                    if(blog_image){
                        if(blog.image?.publicId){
                            await cloudinary.uploader.destroy(blog.image.publicId);
                        }

                        const imageResult = await cloudinary.uploader.upload(blog_image.filepath,{
                            folder: 'blogs/images',
                        })

                        newImage = {
                            url: imageResult.url,
                            publicId: imageResult.public_id
                        }
                    }

                    if (youtube_image){
                        if(blog.youtubeThumbnail?.publicId){
                            await cloudinary.uploader.destroy(blog.youtubeThumbnail.publicId)
                        }

                        const youtubeThumbResult = await cloudinary.uploader.upload(youtube_image.filepath,{
                            folder: 'blogs/thumbnails',
                        })

                        newYoutubeThumb = {
                            url: youtubeThumbResult.url,
                            publicId: youtubeThumbResult.public_id
                        }
                    }

                    await blogModel.findByIdAndUpdate(id, {
                        title, content, desc: description, blockquote: blockQuote, youtubeLink,
                        citation, tags, slug, image: newImage, youtubeThumbnail: newYoutubeThumb
                    })

                    return responseReturn(res, 200, {
                        message: 'Blog updated successfully',
                        blog,
                    });
                }catch(innerErr){
                    return responseReturn(res, 500, {
                        message: innerErr.message,
                        error: innerErr.message
                    })
                }
            })
        }catch(err){
            return responseReturn(res, 500, {message: err.message, error: err.message})
        }
    }

    add_comment = async (req, res) => {
        try {
            const { id } = req.params;
            const { name, email, message } = req.body || {};

            const trimmedName = typeof name === 'string' ? name.trim() : '';
            const trimmedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
            const trimmedMessage = typeof message === 'string' ? message.trim() : '';

            if (!trimmedName || !trimmedEmail || !trimmedMessage) {
                return responseReturn(res, 400, { message: 'Name, email, and message are required.' });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(trimmedEmail)) {
                return responseReturn(res, 400, { message: 'Please provide a valid email address.' });
            }

            const blog = await blogModel.findById(id);
            if (!blog) {
                return responseReturn(res, 404, { message: 'Blog not found.' });
            }

            const moderation = evaluateCommentModeration(trimmedMessage);

            blog.comments.push({
                name: trimmedName,
                email: trimmedEmail,
                message: trimmedMessage,
                status: moderation.status,
                moderationReason: moderation.reason || undefined,
            });

            const newComment = blog.comments[blog.comments.length - 1];
            if (!newComment._id) {
                newComment._id = new mongoose.Types.ObjectId();
            }
            newComment.createdAt = newComment.createdAt || new Date();
            newComment.updatedAt = new Date();

            blog.commentCount = blog.comments.reduce((total, current) => current.status === 'approved' ? total + 1 : total, 0);

            await blog.save();

            const sanitizedComment = {
                _id: newComment._id,
                name: newComment.name,
                message: newComment.message,
                status: newComment.status,
                moderationReason: newComment.moderationReason || '',
                isEdited: newComment.isEdited,
                createdAt: newComment.createdAt,
                updatedAt: newComment.updatedAt
            };

            const responseMessage = newComment.status === 'approved'
                ? 'Your comment has been posted.'
                : 'Thanks! Your comment is awaiting moderation.';

            return responseReturn(res, 201, {
                message: responseMessage,
                comment: sanitizedComment
            });
        } catch (err) {
            const errorMessage = err?.message || 'Failed to submit comment.';
            return responseReturn(res, 500, { message: errorMessage });
        }
    }

    get_public_comments = async (req, res) => {
        try {
            const { id } = req.params;
            const blog = await blogModel.findById(id).select('comments');

            if (!blog) {
                return responseReturn(res, 404, { message: 'Blog not found.' });
            }

            const comments = (blog.comments || [])
                .filter((comment) => comment.status === 'approved')
                .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
                .map(({ _id, name, message, createdAt, updatedAt, isEdited }) => ({
                    _id,
                    name,
                    message,
                    createdAt,
                    updatedAt,
                    isEdited: Boolean(isEdited)
                }));

            return responseReturn(res, 200, { comments });
        } catch (err) {
            return responseReturn(res, 500, { message: err.message });
        }
    }

    get_admin_comments = async (req, res) => {
        try {
            const { id } = req.params;
            const blog = await blogModel.findById(id).select('comments title');

            if (!blog) {
                return responseReturn(res, 404, { message: 'Blog not found.' });
            }

            const comments = (blog.comments || [])
                .map((comment) => ({
                    _id: comment._id,
                    name: comment.name,
                    email: comment.email,
                    message: comment.message,
                    status: comment.status,
                    moderationReason: comment.moderationReason || '',
                    isEdited: Boolean(comment.isEdited),
                    createdAt: comment.createdAt,
                    updatedAt: comment.updatedAt
                }))
                .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

            return responseReturn(res, 200, {
                title: blog.title,
                comments
            });
        } catch (err) {
            return responseReturn(res, 500, { message: err.message });
        }
    }

    update_comment = async (req, res) => {
        try {
            const { blogId, commentId } = req.params;
            const { message, status, moderationReason } = req.body || {};

            const blog = await blogModel.findById(blogId);
            if (!blog) {
                return responseReturn(res, 404, { message: 'Blog not found.' });
            }

            const comment = blog.comments.find((item) => item._id.toString() === commentId);
            if (!comment) {
                return responseReturn(res, 404, { message: 'Comment not found.' });
            }

            const trimmedMessage = typeof message === 'string' ? message.trim() : '';
            const allowedStatuses = ['approved', 'pending', 'rejected'];
            const trimmedModerationReason = typeof moderationReason === 'string' ? moderationReason.trim() : undefined;

            if (!trimmedMessage && !status && typeof trimmedModerationReason === 'undefined') {
                return responseReturn(res, 400, { message: 'No updates provided.' });
            }

            let hasUpdates = false;

            if (trimmedMessage && trimmedMessage !== comment.message) {
                comment.message = trimmedMessage;
                comment.isEdited = true;
                hasUpdates = true;
            }

            if (status && allowedStatuses.includes(status) && status !== comment.status) {
                comment.status = status;
                hasUpdates = true;
            }

            if (typeof trimmedModerationReason !== 'undefined') {
                comment.moderationReason = trimmedModerationReason || undefined;
                hasUpdates = true;
            }

            if (!hasUpdates) {
                return responseReturn(res, 200, { message: 'No changes were applied.', comment: {
                    _id: comment._id,
                    name: comment.name,
                    email: comment.email,
                    message: comment.message,
                    status: comment.status,
                    moderationReason: comment.moderationReason || '',
                    isEdited: Boolean(comment.isEdited),
                    createdAt: comment.createdAt,
                    updatedAt: comment.updatedAt
                }});
            }

            comment.updatedAt = new Date();

            blog.commentCount = blog.comments.reduce((total, current) => current.status === 'approved' ? total + 1 : total, 0);

            await blog.save();

            return responseReturn(res, 200, {
                message: 'Comment updated successfully.',
                comment: {
                    _id: comment._id,
                    name: comment.name,
                    email: comment.email,
                    message: comment.message,
                    status: comment.status,
                    moderationReason: comment.moderationReason || '',
                    isEdited: Boolean(comment.isEdited),
                    createdAt: comment.createdAt,
                    updatedAt: comment.updatedAt
                }
            });
        } catch (err) {
            return responseReturn(res, 500, { message: err.message });
        }
    }

    delete_comment = async (req, res) => {
        try {
            const { blogId, commentId } = req.params;

            const blog = await blogModel.findById(blogId);
            if (!blog) {
                return responseReturn(res, 404, { message: 'Blog not found.' });
            }

            const commentIndex = blog.comments.findIndex((item) => item._id.toString() === commentId);
            if (commentIndex === -1) {
                return responseReturn(res, 404, { message: 'Comment not found.' });
            }

            const [removedComment] = blog.comments.splice(commentIndex, 1);

            blog.commentCount = blog.comments.reduce((total, current) => current.status === 'approved' ? total + 1 : total, 0);

            await blog.save();

            return responseReturn(res, 200, {
                message: 'Comment deleted successfully.',
                comment: {
                    _id: removedComment._id,
                    name: removedComment.name,
                    email: removedComment.email,
                    message: removedComment.message,
                    status: removedComment.status,
                    moderationReason: removedComment.moderationReason || '',
                    isEdited: Boolean(removedComment.isEdited),
                    createdAt: removedComment.createdAt,
                    updatedAt: removedComment.updatedAt
                }
            });
        } catch (err) {
            return responseReturn(res, 500, { message: err.message });
        }
    }

    get_adjacent_blog = async(req, res)=> {
        try{
            const {id} = req.params;
            const currentBlog = await blogModel.findById(id);
    
            const prevBlog = await blogModel.findOne({ createdAt: { $lt: currentBlog.createdAt } }).sort({ createdAt: -1 });
            const nextBlog = await blogModel.findOne({ createdAt: { $gt: currentBlog.createdAt } }).sort({ createdAt: 1 });
          
            return responseReturn(res, 200, {prev: prevBlog || null, next: nextBlog || null});
        }catch(error){
            return responseReturn(res, 500, {message: error.message})
        }
    }

    get_recent_blogs = async(req, res) => {
        try{
            const blogs = await blogModel.find().sort({createdAt: -1}).limit(5);

            return responseReturn(res, 200, {blogs})
        }catch(error){
            return responseReturn(res, 500, {message: error.message})
        }
    }
}

export default new blogController();