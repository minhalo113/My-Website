import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../api/api'

export const get_admin_dashboard_data = createAsyncThunk(
    'dashboard/get_admin_dashboard_data',
    async(_arg, {rejectWithValue, fulfillWithValue}) => {
        try{
            const {data} = await api.get('/admin/dashboard-data', {withCredentials: true});
            return fulfillWithValue(data);
        }catch(error){
            return rejectWithValue(error.response.data);
        }
    }
)

export const dashboardReducer = createSlice({
    name: 'dashboard',
    initialState: {
        totalSale: 0,
        totalOrder: 0,
        totalProduct: 0,
        totalCustomer: 0,
        recentOrder: [],
    },
    reducers: {},
    extraReducers: (builder) => {
        builder.addCase(get_admin_dashboard_data.fulfilled, (state, {payload}) => {
            state.totalSale = payload.totalSale;
            state.totalOrder = payload.totalOrder;
            state.totalProduct = payload.totalProduct;
            state.totalCustomer = payload.totalCustomer;
            state.recentOrder = payload.recentOrder;
        })
    }
});

export default dashboardReducer.reducer;