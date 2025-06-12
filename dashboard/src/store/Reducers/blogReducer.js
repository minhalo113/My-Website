import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

export const add_blog = createAsyncThunk(
    'blog/add_blog',
    async(formData, {rejectWithValue, fulfillWithValue}) => {
        try{
            const {data} = await api.post('/add_blog', formData, {withCredentials: true});
            return fulfillWithValue(data)
        }catch(err){
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
  
        const blogsRes = await api.get('/get_blogs', {
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
    async(id, {rejectWithValue, fulfillWithValue}) => {
        try{
            const {data} = await api.get(`/get_blog/${id}`, {withCredentials: true})
            return fulfillWithValue(data);
        }catch(err){
            const errorData = err.response?.data || {message: err.message};
            return rejectWithValue(errorData);
        }
    }
)

export const get_blogs = createAsyncThunk(
    'blog/get-blogs',
    async( obj ,{rejectWithValue, fulfillWithValue}) => {
        try{
            const {data} = await api.get('/get_blogs', {params: obj, withCredentials: true})
            return fulfillWithValue(data)
        }catch(err){
            return rejectWithValue(err.response.data)
        }
    }
)

export const automate_create_blog = createAsyncThunk(
    'blog/create_auto_blog',
    async(aiTitleInput, {rejectWithValue, fulfillWithValue}) => {
        try{
            const {data} = await api.get('/automate_create_blog', aiTitleInput, {withCredentials: true});
            return fulfillWithValue(data)
        }catch(err){
            return rejectWithValue(err.response.data)
        }
    }
)

export const update_blog = createAsyncThunk(
    'blog/update_blog',
    async(data, {rejectWithValue, fulfillWithValue}) => {
        try{
            const res = await api.patch('/update-blog', data, {withCredentials: true});
            return fulfillWithValue(res.data)
        }catch(err){
            return rejectWithValue(err.response.data)
        }
    }
)

export const blogReducer = createSlice({
    name: 'blog',
    initialState: {
        successMessage: '',
        errorMessage: '',
        loader: false,
        blogs: [],
        blog: {},
        totalBlog: 0
    },
    reducers: {
        messageClear: (state, _) => {
            state.errorMessage = ""
            state.successMessage = ""
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase(add_blog.rejected, (state, {payload}) => {
            //
            state.errorMessage = payload.message
        })
        .addCase(add_blog.fulfilled, (state, {payload}) => {
            //
            state.successMessage = payload.message
        })

        .addCase(delete_blog.rejected, (state, {payload}) => {
            //
            state.errorMessage = payload.message;
        })
        .addCase(delete_blog.fulfilled, (state, {payload}) => {
            //
            state.successMessage = payload.message;
            state.blogs = payload.blogs;
        })

        .addCase(get_blog.rejected, (state, {payload}) => {
            //
            state.errorMessage = payload?.message || 'Failed to fetch blog';
        })
        .addCase(get_blog.fulfilled, (state, {payload}) => {
            //
            state.blog = payload.blog;
        })

        .addCase(get_blogs.rejected, (state, {payload}) => {
            //
            state.errorMessage = payload.message;
        })
        .addCase(get_blogs.fulfilled, (state, {payload}) => {
            //
            state.blogs = payload.blogs
        })

        .addCase(automate_create_blog.rejected, (state, {payload}) => {
            //
        })
        .addCase(automate_create_blog.fulfilled, (state, {payload}) => {
            //
        })

        .addCase(update_blog.rejected, (state, {payload}) => {
            //
            state.errorMessage = payload.message;
        })
        .addCase(update_blog.fulfilled, (state, {payload}) => {
            //
            state.blog = payload.blog;
            state.successMessage = payload.message;
        })
    }
})

export const {messageClear} = blogReducer.actions
export default blogReducer.reducer;