import { createAsyncThunk, createSlice, isRejectedWithValue } from "@reduxjs/toolkit";
import api from "../../api/api";

export const get_seller_orders = createAsyncThunk(
    'orders/get_seller_orders',
    async({parPage, page, searchValue}, {rejectWithValue, fulfillWithValue}) => {
        try{
            const {data} = await api.get(`/seller/orders?searchValue=${searchValue}&page=${page}&parPage=${parPage}`, {withCredentials: true})
            return fulfillWithValue(data)
        }catch(error){
            return rejectWithValue(error.response.data)
        }
    }
)

export const get_seller_order = createAsyncThunk(
    'orders/get_seller_order',
    async(orderId, {rejectWithValue, fulfillWithValue}) => {
        try{
            const {data} = await api.get(`/seller/order/${orderId}`, {withCredentials: true})
            return fulfillWithValue(data)
        }catch(error){
            return rejectWithValue(error.response.data)
        }
    }
)

export const seller_order_delivery_status_update = createAsyncThunk(
    'orders/seller_order_delivery_status_update',
    async({orderId, info}, {rejectWithValue, fulfillWithValue}) => {
        try{
            const {data} = await api.put(`/seller/order-delivery-status/update/${orderId}`, info, {withCredentials: true})  
            return fulfillWithValue(data)
        }catch(error){
            return rejectWithValue(error.response.data)
        }
    }
)

export const seller_order_accept_reject_status_update = createAsyncThunk(
    'orders/seller_order_accept_reject_status_update',
    async({orderId, info}, {rejectWithValue, fulfillWithValue}) => {
        try{
            const {data} = await api.put(`/seller/order-status/update/${orderId}`, info, {withCredentials: true})
            return fulfillWithValue(data)
        }catch(error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const delete_order = createAsyncThunk(
    'orders/delete_order',
    async(orderId, {rejectWithValue, fulfillWithValue}) => {
        try{
            const {data} = await api.delete(`/seller/order/${orderId}`, {withCredentials: true})
            return fulfillWithValue(data)
        }catch(error){
            return rejectWithValue(error.response.data)
        }
    }
)

export const seller_payment_accept_reject_status_update = createAsyncThunk(
    'orders/seller_payment_accept_reject_status_update',
    async({orderId, info} , {rejectWithValue, fulfillWithValue}) => {
        try{
            const {data} = await api.put(`/seller/order-payment-status/update/${orderId}`, info, {withCredentials: true})
            return fulfillWithValue(data)
        }catch(error){
            return rejectWithValue(error.response.data)
        }
    }
)

export const OrderReducer = createSlice({
    name: 'order',
    initialState: {
        successMessage: '',
        errorMessage: '',
        totalOrder: 0,
        order: {},
        myOrders: [],
        reloadOrders: true
    },
    reducers: {
        messageClear: (state, _) => {
            state.errorMessage = ""
            state.successMessage = ""
        },
        clearReloadOrders: (state, _) => {
            state.reloadOrders = ""
        }
    },
    extraReducers: (builder) => {
        builder

        .addCase(get_seller_orders.fulfilled, (state, {payload}) => {
            state.myOrders = payload.orders;
            state.totalOrder = payload.totalOrder;
        })
        .addCase(get_seller_order.fulfilled, (state, {payload}) => {
            state.order = payload.order
        })

        .addCase(seller_order_delivery_status_update.rejected, (state, {payload}) => {
            state.errorMessage = payload.message;
            state.reloadOrders = true;
        })
        .addCase(seller_order_delivery_status_update.fulfilled, (state, {payload}) => {
            state.successMessage = payload.message;
            state.reloadOrders = true;
        })

        .addCase(seller_order_accept_reject_status_update.fulfilled, (state, {payload}) => {
            state.successMessage = payload.message
            state.reloadOrders = true;
        })
        .addCase(seller_order_accept_reject_status_update.rejected, (state, {payload}) => {
            state.errorMessage = payload.message
            state.reloadOrders = true;
        })

        .addCase(seller_payment_accept_reject_status_update.fulfilled, (state, {payload}) => {
            state.successMessage = payload.message
            state.reloadOrders = true;
        })
        .addCase(seller_payment_accept_reject_status_update.rejected, (state, {payload}) => {
            state.errorMessage = payload.message
            state.reloadOrders = true;
        })

        .addCase(delete_order.fulfilled, (state, action) => {
            state.successMessage = action.payload.message;
            state.myOrders = state.myOrders.filter(order => order._id !== action.meta.arg)
            state.reloadOrders = true;
        })
        .addCase(delete_order.rejected, (state, {payload}) => {
            state.errorMessage = payload.message
            state.reloadOrders = true
        })
    }
})

export const {messageClear, clearReloadOrders} = OrderReducer.actions
export default OrderReducer.reducer