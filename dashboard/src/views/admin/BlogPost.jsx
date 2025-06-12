import { useEffect, useState } from "react";
import { IoMdAdd } from "react-icons/io";
import { FaTrash, FaEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { get_blogs, messageClear, delete_blog } from "../../store/Reducers/blogReducer";
import toast from "react-hot-toast";

const BlogPost = () => {
    const navigate = useNavigate()
    const dispatch = useDispatch();

    const {loader, blogs, blog, totalBlog, errorMessage, successMessage} = useSelector(state => state.blog)

    useEffect(() => { 
      if (successMessage){
        toast.success(successMessage);
        dispatch(messageClear)
      }

      if(errorMessage){
        toast.error(errorMessage);
        dispatch(messageClear)
      }

      let obj = {
        parPage: null, page: null, searchValue: null
      }
      dispatch(get_blogs(obj))
    }, [errorMessage, successMessage])

    const handleDelete = async (id) => {
      const confirmed = window.confirm("Are you sure you want to delete this blog post?");
      if (!confirmed) return;

      try{
        const result = await dispatch(delete_blog(id));
      }catch(err){
        alert(err.response?.data?.message || "Unexpected error while deleting blog");
      }
    };

  const handleEdit = (id) => {
    // Placeholder function - you can link to an edit page or open a modal
    navigate(`/admin/dashboard/blog-edit/${id}`);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Blog Posts</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"   onClick={() => navigate('/admin/dashboard/add-blog')}>
          <IoMdAdd size={20} /> Add Blog
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Title</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Author</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Date</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {blogs.map((blog) => (
                <tr key={blog.id}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{blog.title}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{blog.author}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{blog.date}</td>
                  <td className="px-6 py-4 text-right space-x-4">
                    <button
                      onClick={() => handleEdit(blog._id)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(blog._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))}
              {blogs.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-gray-500">
                    No blog posts available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        </div>
    </div>
  );
};

export default BlogPost;
