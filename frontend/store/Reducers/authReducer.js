import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api"
import ActionTypes from './../../node_modules/redux/src/utils/actionTypes';
import {jwtDecode} from 'jwt-decode'

// decode token to check role
const returnRole = (token) => {
    if(typeof window !== "undefined"){
        if (token){
            const decodeToken = jwtDecode(token)
            const expireTime = new Date(decodeToken.exp * 1000)

            if (new Date() > expireTime){
                localStorage.removeItem('accessToken')
                return ''
            }else{
                return decodeToken.role
            }
        }else{
            return ''
        }
    }else{
        return "guest"
    }
}

// call admin login API to backend server
export const admin_login = createAsyncThunk(
    'auth/admin_login',
    async(info, {rejectWithValue, fulfillWithValue}) =>{

        try{
            const {data} = await api.post("/admin-login", info, {withCredentials: true})
            localStorage.setItem("accessToken", data.token)
            return fulfillWithValue(data)
        }catch (error){
            return rejectWithValue(error?.response?.data || "An unknown error occured");
        }
    }
)

export const authReducer = createSlice({
    name: "auth",
    initialState: {
        successMessage: '',
        errorMessage: '',
        loader: false,
        userInfo: '',
        role: typeof window !== "undefined" ? returnRole(localStorage.getItem('accessToken')) : "guest",
        token: typeof window !== "undefined" ? localStorage.getItem('accessToken') : "null"
    },
    reducers: {
        messageClear: (state, _) => {
            state.errorMessage = ""
            state.successMessage = ""
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase(admin_login.pending, (state, {payload}) => {
            state.loader = true;
        })
        .addCase(admin_login.rejected, (state, {payload}) => {
            state.loader = false;
            state.errorMessage = payload.error
        })
        .addCase(admin_login.fulfilled, (state, {payload}) => {
            state.loader = false;
            state.userInfo = payload.userInfo;
            state.successMessage = payload.message;
        })
    }
})

export const {messageClear} = authReducer.actions
export default authReducer.reducer