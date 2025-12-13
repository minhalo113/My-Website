import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  get_blog_comments_admin,
  update_blog_comment,
  delete_blog_comment,
  messageClear
} from '../../store/Reducers/blogReducer';

const statusOptions = [
  { value: 'approved', label: 'Approved' },
  { value: 'pending', label: 'Pending' },
  { value: 'rejected', label: 'Rejected' }
];

const BlogComments = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    commentList,
    commentLoader,
    errorMessage,
    successMessage,
    selectedBlogTitle
  } = useSelector((state) => state.blog);

  useEffect(() => {
    if (!id) return;
    dispatch(get_blog_comments_admin(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
    }
  }, [successMessage, dispatch]);

  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
  }, [errorMessage, dispatch]);

  const handleRefresh = () => {
    if (!id) return;
    dispatch(get_blog_comments_admin(id));
  };

  const handleStatusChange = (commentId, status) => {
    dispatch(update_blog_comment({ blogId: id, commentId, payload: { status } }));
  };

  const handleEditMessage = (comment) => {
    const updated = window.prompt('Update comment message', comment.message);
    if (updated === null) return;

    const trimmed = updated.trim();
    if (!trimmed) {
      toast.error('Comment message cannot be empty.');
      return;
    }

    dispatch(update_blog_comment({ blogId: id, commentId: comment._id, payload: { message: trimmed } }));
  };

  const handleModerationNote = (comment) => {
    const updated = window.prompt('Update moderation note', comment.moderationReason || '');
    if (updated === null) return;

    dispatch(update_blog_comment({ blogId: id, commentId: comment._id, payload: { moderationReason: updated.trim() } }));
  };

  const handleDelete = (commentId) => {
    const confirmed = window.confirm('Are you sure you want to delete this comment?');
    if (!confirmed) return;
    dispatch(delete_blog_comment({ blogId: id, commentId }));
  };

  const formatDate = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Blog Comments</h1>
          <p className="text-sm text-gray-500">
            Moderate guest feedback for <span className="font-semibold">{selectedBlogTitle || 'this blog'}</span>.
          </p>
        </div>
        <div className="space-x-2">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={() => navigate(-1)}
          >
            Back
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={handleRefresh}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Author</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Message</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Moderation Note</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Updated</th>
                <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {commentLoader ? (
                <tr>
                  <td colSpan="6" className="px-6 py-6 text-center text-gray-500">Loading comments...</td>
                </tr>
              ) : commentList.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-6 text-center text-gray-500">No comments yet.</td>
                </tr>
              ) : (
                commentList.map((comment) => (
                  <tr key={comment._id}>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <p className="font-semibold">{comment.name}</p>
                      <p className="text-gray-500">{comment.email}</p>
                      <p className="text-xs text-gray-400">Submitted: {formatDate(comment.createdAt)}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-pre-wrap">
                      {comment.message}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <select
                        className="border border-gray-300 rounded px-2 py-1"
                        value={comment.status}
                        onChange={(e) => handleStatusChange(comment._id, e.target.value)}
                      >
                        {statusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {comment.moderationReason || '—'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">{formatDate(comment.updatedAt)}</td>
                    <td className="px-6 py-4 text-sm text-right space-x-2">
                      <button
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        onClick={() => handleEditMessage(comment)}
                      >
                        Edit
                      </button>
                      <button
                        className="px-3 py-1 bg-indigo-200 text-indigo-700 rounded hover:bg-indigo-300"
                        onClick={() => handleModerationNote(comment)}
                      >
                        Note
                      </button>
                      <button
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        onClick={() => handleDelete(comment._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BlogComments;