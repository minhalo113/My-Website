import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

export const add_blog = createAsyncThunk(
    'blog/add_blog',
    async (formData, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.post('/add_blog', formData, { withCredentials: true });
            return fulfillWithValue(data)
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
)

export const delete_blog = createAsyncThunk(
    'blog/delete_blog',
    async (id, { rejectWithValue, fulfillWithValue }) => {
        try {
            const res = await api.delete(`/delete_blog/${id}`, {
                withCredentials: true
            });

            const blogsRes = await api.get('/get_admin_blogs', {
                withCredentials: true
            });

            return fulfillWithValue({
                message: res.data.message,
                blogs: blogsRes.data.blogs
            });
        } catch (err) {
            const errorData = err.response?.data || { message: err.message };
            return rejectWithValue(errorData);
        }
    }
);

export const get_blog = createAsyncThunk(
    'blog/get-blog',
    async (id, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.get(`/get_admin_blog/${id}`, { withCredentials: true })
            return fulfillWithValue(data);
        } catch (err) {
            const errorData = err.response?.data || { message: err.message };
            return rejectWithValue(errorData);
        }
    }
)

export const get_blogs = createAsyncThunk(
    'blog/get-blogs',
    async (obj, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.get('/get_admin_blogs', { params: obj, withCredentials: true })
            return fulfillWithValue(data)
        } catch (err) {
            return rejectWithValue(err.response.data)
        }
    }
)

export const automate_create_blog = createAsyncThunk(
    'blog/create_auto_blog',
    async (payload, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.post('/automate_create_blog', payload, { withCredentials: true });
            return fulfillWithValue(data)
        } catch (err) {
            const errorData = err.response?.data || { message: err.message };
            return rejectWithValue(errorData)
        }
    }
)

export const update_blog = createAsyncThunk(
    'blog/update_blog',
    async (data, { rejectWithValue, fulfillWithValue }) => {
        try {
            const res = await api.patch('/update-blog', data, { withCredentials: true });
            return fulfillWithValue(res.data)
        } catch (err) {
            return rejectWithValue(err.response.data)
        }
    }
)

export const update_blog_status = createAsyncThunk(
    'blog/update_blog_status',
    async (data, { rejectWithValue, fulfillWithValue }) => {
        try {
            const res = await api.patch('/update_blog_status', data, { withCredentials: true });
            return fulfillWithValue(res.data);
        } catch (err) {
            return rejectWithValue(err.response.data);
        }
    }
)

export const get_blog_comments_admin = createAsyncThunk(
    'blog/get_blog_comments_admin',
    async (blogId, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.get(`/blog/${blogId}/comments/manage`, { withCredentials: true });
            return fulfillWithValue({ ...data, blogId });
        } catch (err) {
            const errorData = err.response?.data || { message: err.message };
            return rejectWithValue(errorData);
        }
    }
);

export const update_blog_comment = createAsyncThunk(
    'blog/update_blog_comment',
    async ({ blogId, commentId, payload }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.patch(`/blog/${blogId}/comments/${commentId}`, payload, { withCredentials: true });
            return fulfillWithValue({ ...data, blogId });
        } catch (err) {
            const errorData = err.response?.data || { message: err.message };
            return rejectWithValue(errorData);
        }
    }
);

export const delete_blog_comment = createAsyncThunk(
    'blog/delete_blog_comment',
    async ({ blogId, commentId }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.delete(`/blog/${blogId}/comments/${commentId}`, { withCredentials: true });
            return fulfillWithValue({ ...data, blogId, commentId });
        } catch (err) {
            const errorData = err.response?.data || { message: err.message };
            return rejectWithValue(errorData);
        }
    }
);


export const blogReducer = createSlice({
    name: 'blog',
    initialState: {
        successMessage: '',
        errorMessage: '',
        loader: false,
        blogs: [],
        blog: {},
        totalBlog: 0,
        aiBlogData: null,
        commentList: [],
        commentLoader: false,
        selectedBlogTitle: '',
    },
    reducers: {
        messageClear: (state, _) => {
            state.errorMessage = ""
            state.successMessage = ""
        },
        clearAiBlogData: (state) => {
            state.aiBlogData = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(add_blog.rejected, (state, { payload }) => {
                //
                state.errorMessage = payload.message
            })
            .addCase(add_blog.fulfilled, (state, { payload }) => {
                //
                state.successMessage = payload.message
            })

            .addCase(delete_blog.rejected, (state, { payload }) => {
                //
                state.errorMessage = payload.message;
            })
            .addCase(delete_blog.fulfilled, (state, { payload }) => {
                //
                state.successMessage = payload.message;
                state.blogs = payload.blogs;
            })

            .addCase(get_blog.rejected, (state, { payload }) => {
                //
                state.errorMessage = payload?.message || 'Failed to fetch blog';
            })
            .addCase(get_blog.fulfilled, (state, { payload }) => {
                //
                state.blog = payload.blog
            })

            .addCase(get_blogs.rejected, (state, { payload }) => {
                //
                state.loader = false;
                state.errorMessage = payload?.message || 'Failed to load blogs';
                state.blogs = [];
            })
            .addCase(get_blogs.fulfilled, (state, { payload }) => {
                //
                state.loader = false;
                state.blogs = payload.blogs;
                state.totalBlog = payload.totalBlogs || 0;
            })
            .addCase(get_blogs.pending, (state) => {
                state.loader = true;
                state.errorMessage = "";
            })

            .addCase(automate_create_blog.pending, (state) => {
                state.loader = true;
                state.errorMessage = "";
                state.successMessage = "";
            })
            .addCase(automate_create_blog.rejected, (state, { payload }) => {
                state.loader = false;
                state.errorMessage = payload?.message || 'Failed to generate AI blog content';
            })
            .addCase(automate_create_blog.fulfilled, (state, { payload }) => {
                state.loader = false;
                state.aiBlogData = payload.blog;
                state.successMessage = payload.message;
            })

            .addCase(update_blog.rejected, (state, { payload }) => {
                //
                state.errorMessage = payload.message;
            })
            .addCase(update_blog.fulfilled, (state, { payload }) => {
                //
                state.blog = payload.blog;
                state.successMessage = payload.message;
            })

            .addCase(update_blog_status.rejected, (state, { payload }) => {
                state.errorMessage = payload.message;
            })
            .addCase(update_blog_status.fulfilled, (state, { payload }) => {
                state.successMessage = payload.message;

                const index = state.blogs.findIndex(b => b._id === payload.blog._id);
                if (index !== -1) {
                    state.blogs[index].status = payload.blog.status;
                }
            })

            .addCase(get_blog_comments_admin.pending, (state) => {
                state.commentLoader = true;
                state.errorMessage = "";
                state.successMessage = "";
            })
            .addCase(get_blog_comments_admin.rejected, (state, { payload }) => {
                state.commentLoader = false;
                state.errorMessage = payload?.message || 'Failed to load comments';
            })
            .addCase(get_blog_comments_admin.fulfilled, (state, { payload }) => {
                state.commentLoader = false;
                state.commentList = payload.comments || [];
                state.selectedBlogTitle = payload.title || '';
            })

            .addCase(update_blog_comment.rejected, (state, { payload }) => {
                state.errorMessage = payload?.message || 'Failed to update comment';
            })
            .addCase(update_blog_comment.fulfilled, (state, { payload }) => {
                state.successMessage = payload?.message || 'Comment updated successfully';
                const updated = payload?.comment;
                if (updated) {
                    state.commentList = state.commentList.map((comment) =>
                        comment._id === updated._id ? { ...comment, ...updated } : comment
                    );
                }
            })

            .addCase(delete_blog_comment.rejected, (state, { payload }) => {
                state.errorMessage = payload?.message || 'Failed to delete comment';
            })
            .addCase(delete_blog_comment.fulfilled, (state, { payload }) => {
                state.successMessage = payload?.message || 'Comment deleted successfully';
                const removedId = payload?.comment?._id || payload?.commentId;
                if (removedId) {
                    state.commentList = state.commentList.filter((comment) => comment._id !== removedId);
                }
            })
    }
})

export const { messageClear, clearAiBlogData } = blogReducer.actions
export default blogReducer.reducer;