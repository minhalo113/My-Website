import formidable from 'formidable';
import responseReturn from '../../utils/response.js';
import { v2 as cloudinary } from 'cloudinary';
import blogModel from "../../models/blogModel.js"
import slugify from 'slugify'

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

            return responseReturn(res, 200, {blog})
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
            //
        }catch(err){
            //
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