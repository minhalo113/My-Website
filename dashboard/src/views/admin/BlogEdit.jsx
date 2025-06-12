import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { messageClear, update_blog, get_blog } from '../../store/Reducers/blogReducer';
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";

const BlogEdit = () => {
    const dispatch = useDispatch();
    const {id} = useParams();

    const {blog, successMessage, errorMessage} = useSelector(state => state.blog)
  const [formData, setFormData] = useState({
    image: '',
    title: '',
    content: '',
    description: '',
    blockQuote: '',
    youtubeLink: '',
    youtubeThumbnail: '',
    citation: '',
    tags: '',
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [previewYoutubeThumbnail, setPreviewYoutubeThumbnail] = useState(null);

  useEffect(() => {
    if(successMessage){
        toast.success(successMessage);
        dispatch(messageClear());
    }
    if(errorMessage){
        toast.error(errorMessage);
        dispatch(messageClear());
    }
    if(id){
        dispatch(get_blog(id))

    }
  }, [successMessage, errorMessage, dispatch, id])

  useEffect(() => {
    if (blog && blog.title) {
      setFormData({
        image: blog.image,
        title: blog.title,
        content: blog.content,
        description: blog.desc,
        blockQuote: blog.blockquote,
        youtubeLink: blog.youtubeLink,
        youtubeThumbnail: blog.youtubeThumbnail,
        citation: blog.citation,
        tags: blog.tags,
      });
    }
  }, [blog]);
  

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image' || name === 'youtubeThumbnail') {
      const file = files[0];
      if (file) {
        const previewUrl = URL.createObjectURL(file);
        if (name === 'image') setPreviewImage(previewUrl);
        if (name === 'youtubeThumbnail') setPreviewYoutubeThumbnail(previewUrl);
      }
      setFormData({ ...formData, [name]: file });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
  
    const data = new FormData();
    for (let key in formData) {
      data.append(key, formData[key]);
    }
  
    data.append("id", id);
  
    dispatch(update_blog(data));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Edit Blog Post</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Blog Image</label>
          <input type="file" name="image" accept="image/*" onChange={handleChange} className="mt-1" />
          {(previewImage || blog?.image?.url) && (
                <img
                    src={previewImage || blog.image.url}
                    alt="Blog Preview"
                    className="mt-2 w-48 h-auto rounded"
                />
                )}
        </div>

        <div>
          <label className="block text-sm font-medium">Title</label>
          <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">Description</label>
          <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded"></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium">Content</label>
          <textarea name="content" value={formData.content} onChange={handleChange} rows={8} className="w-full p-2 border rounded"></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium">Block Quote</label>
          <input type="text" name="blockQuote" value={formData.blockQuote} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">YouTube Link</label>
          <input type="text" name="youtubeLink" value={formData.youtubeLink} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">YouTube Thumbnail</label>
          <input type="file" name="youtubeThumbnail" accept="image/*" onChange={handleChange} className="mt-1" />
          {(previewYoutubeThumbnail || blog?.youtubeThumbnail?.url) && (
            <img
                src={previewYoutubeThumbnail || blog.youtubeThumbnail.url}
                alt="YouTube Thumbnail Preview"
                className="mt-2 w-48 h-auto rounded"
            />
            )}
        </div>

        <div>
          <label className="block text-sm font-medium">Citation</label>
          <input type="text" name="citation" value={formData.citation} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">Tags (comma-separated)</label>
          <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Save Changes</button>
      </form>
    </div>
  );
};

export default BlogEdit;