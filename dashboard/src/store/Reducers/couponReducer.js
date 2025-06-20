import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

export const add_coupon = createAsyncThunk(
    'coupon/add_coupon',
    async({code, discount, maxUses}, {rejectWithValue, fulfillWithValue}) => {
        try{
            const {data} = await api.post('/coupon-add', {code, discount, maxUses}, {withCredentials: true});
            return fulfillWithValue(data);
        }catch(error){
            return rejectWithValue(error.response.data);
        }
    }
)

export const get_coupons = createAsyncThunk(
    'coupon/get_coupons',
    async(_, {rejectWithValue, fulfillWithValue}) => {
        try{
            const {data} = await api.get('/coupon-get', {withCredentials: true});
            return fulfillWithValue(data);
        }catch(error){
            return rejectWithValue(error.response.data);
        }
    }
)

const couponSlice = createSlice({
    name: 'coupon',
    initialState: {
        coupons: [],
        loader: false,
        successMessage: '',
        errorMessage: ''
    },
    reducers: {
        messageClear: (state) => {
            state.successMessage = '';
            state.errorMessage = '';
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase(add_coupon.pending, (state) => {state.loader = true})
        .addCase(add_coupon.fulfilled, (state, {payload}) => {
            state.loader = false;
            state.successMessage = payload.message;
            state.coupons.push(payload.coupon);
        })
        .addCase(add_coupon.rejected, (state, {payload}) => {
            state.loader = false;
            state.errorMessage = payload.error;
        })

        .addCase(get_coupons.fulfilled, (state, {payload}) => {
            state.loader = false;
            state.coupons = payload.coupons;
        })
        .addCase(get_coupons.pending, (state) => {state.loader = true;})
        .addCase(get_coupons.rejected, (state, {payload}) => {
            state.loader = false;
            state.errorMessage = payload.error
        })
    }
})

export const {messageClear} = couponSlice.actions;
export default couponSlice.reducer;