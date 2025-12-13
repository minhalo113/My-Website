import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { add_blog, automate_create_blog } from '../../store/Reducers/blogReducer';
import toast from "react-hot-toast";
import { clearAiBlogData, messageClear } from "../../store/Reducers/blogReducer";

const initialFormState = {
    image: '',
    title: '',
    content: '',
    description: '',
    blockQuote: '',
    youtubeLink: '',
    youtubeThumbnail: '',
    citation: '',
    tags: '',
  };

const AddBlog = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState(initialFormState);
  const {loader, successMessage, errorMessage, aiBlogData} = useSelector(state => state.blog)

  const [previewImage, setPreviewImage] = useState(null);
  const formRef = useRef(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image') {
      const file = files[0];
      if (file) {
        const previewUrl = URL.createObjectURL(file);
        setPreviewImage(previewUrl);
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
        setFormData({ ...initialFormState });
        setPreviewImage(null);
        if (formRef.current) {
            formRef.current.reset();
        }
    }
    if(errorMessage){
        toast.error(errorMessage);
        dispatch(messageClear());
    }
  }, [successMessage, errorMessage, dispatch])

  useEffect(() => {
    if (aiBlogData){
        setFormData((prev) => ({
            ...prev,
            title: aiBlogData.title || prev.title,
            content: aiBlogData.content || prev.content,
            description: aiBlogData.description || prev.description,
            blockQuote: aiBlogData.blockQuote || prev.blockQuote,
            tags: Array.isArray(aiBlogData.tags) ? aiBlogData.tags.join(', ') : prev.tags,
        }));
        dispatch(clearAiBlogData());
    }
  }, [aiBlogData, dispatch])

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    for (let key in formData){
        data.append(key, formData[key])
    }

    dispatch(add_blog(data));
  };

  const handleAutoGenerate = async () => {
    const trimmedTitle = formData.title.trim();
    const trimmedContent = formData.content.trim();

    if (!trimmedTitle || !trimmedContent){
        toast.error('Please add a title and content before requesting AI suggestions.');
        return;
    }
    dispatch(automate_create_blog({
      title: trimmedTitle,
      content: trimmedContent,
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Add New Blog Post</h2>
      <form onSubmit={handleSubmit} className="space-y-4" ref={formRef}>
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
          <label className="block text-sm font-medium">Citation</label>
          <input type="text" name="citation" value={formData.citation} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">Tags (comma-separated)</label>
          <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <div className="flex gap-4 items-center">
          <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">Add Blog</button>
          <button
            type="button"
            onClick={handleAutoGenerate}
            disabled={loader}
            className={`px-6 py-2 rounded text-white ${loader ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {loader ? 'Generating…' : 'Auto Generate with AI'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddBlog;
