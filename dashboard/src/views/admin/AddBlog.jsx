import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { add_blog, automate_create_blog } from '../../store/Reducers/blogReducer';
import toast from "react-hot-toast";
import { messageClear } from "../../store/Reducers/blogReducer";

const AddBlog = () => {
    const dispatch = useDispatch();
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

  const {loader, successMessage, errorMessage} = useSelector(state => state.blog)

  const [previewImage, setPreviewImage] = useState(null);
  const [previewYoutubeThumbnail, setPreviewYoutubeThumbnail] = useState(null);
  const [showPromptInput, setShowPromptInput] = useState(false);
  const [aiTitleInput, setAiTitleInput] = useState('');

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

  useEffect(() => {
    if (successMessage){
        toast.success(successMessage)
        dispatch(messageClear());
    }
    if(errorMessage){
        toast.error(errorMessage);
        dispatch(messageClear());
    }
  }, [successMessage, errorMessage, dispatch]) 

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    for (let key in formData){
        data.append(key, formData[key])
    }

    dispatch(add_blog(data));
  };

  const handleAutoGenerate = async () => {
    if (!aiTitleInput.trim()) return;

    try {
        dispatch(automate_create_blog(aiTitleInput))
    } catch (error) {
      console.error("Failed to generate blog:", error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Add New Blog Post</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Blog Image</label>
          <input type="file" name="image" accept="image/*" onChange={handleChange} className="mt-1" />
          {previewImage && <img src={previewImage} alt="Blog Preview" className="mt-2 w-48 h-auto rounded" />}
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
          {previewYoutubeThumbnail && <img src={previewYoutubeThumbnail} alt="YouTube Thumbnail Preview" className="mt-2 w-48 h-auto rounded" />}
        </div>

        <div>
          <label className="block text-sm font-medium">Citation</label>
          <input type="text" name="citation" value={formData.citation} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">Tags (comma-separated)</label>
          <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <div className="flex gap-4 items-center">
          <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add Blog</button>
          <button type="button" onClick={() => setShowPromptInput(prev => !prev)} className="px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Auto Generate with AI</button>
        </div>

        {showPromptInput && (
          <div className="mt-4 bg-gray-100 p-4 rounded border">
            <label className="block text-sm font-medium mb-1">Enter Blog Title for AI:</label>
            <input
              type="text"
              value={aiTitleInput}
              onChange={(e) => setAiTitleInput(e.target.value)}
              placeholder="e.g., Best Laptops for Students in 2025"
              className="w-full p-2 border rounded mb-2"
            />
            <button
              onClick={handleAutoGenerate}
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Generate Now
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default AddBlog;
