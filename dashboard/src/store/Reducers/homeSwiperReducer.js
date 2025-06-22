import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/api';

export const add_swiper_item = createAsyncThunk(
  'homeSwiper/add',
  async(formData, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.post('/home-swiper-add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const get_swiper_items = createAsyncThunk(
  'homeSwiper/get',
  async(_, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.get('/home-swiper-get');
      return fulfillWithValue(data);
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const delete_swiper_item = createAsyncThunk(
  'homeSwiper/delete',
  async(id, { rejectWithValue, fulfillWithValue }) => {
    try {
      const { data } = await api.delete(`/home-swiper/${id}`, { withCredentials: true });
      return fulfillWithValue({ data, id });
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const swiperSlice = createSlice({
  name: 'homeSwiper',
  initialState: {
    items: [],
    loader: false,
    successMessage: '',
    errorMessage: ''
  },
  reducers: {
    messageClear: state => {
      state.successMessage = '';
      state.errorMessage = '';
    }
  },
  extraReducers: builder => {
    builder
      .addCase(add_swiper_item.pending, state => { state.loader = true; })
      .addCase(add_swiper_item.fulfilled, (state, { payload }) => {
        state.loader = false;
        state.successMessage = payload.message;
        state.items.unshift(payload.item);
      })
      .addCase(add_swiper_item.rejected, (state, { payload }) => {
        state.loader = false;
        state.errorMessage = payload.error;
      })

      .addCase(get_swiper_items.fulfilled, (state, { payload }) => {
        state.items = payload.items;
      })
      .addCase(delete_swiper_item.fulfilled, (state, { payload }) => {
        state.successMessage = payload.data.message;
        state.items = state.items.filter(i => i._id !== payload.id);
      });
  }
});

export const { messageClear } = swiperSlice.actions;
export default swiperSlice.reducer;