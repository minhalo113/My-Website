import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";

export const add_product = createAsyncThunk(
    'product/add_product',
    async(product, {rejectWithValue, fulfillWithValue}) => {
        try{
            const {data} = await api.post('/product-add', product, {withCredentials: true})
            return fulfillWithValue(data)
        }catch(error){
            return rejectWithValue(error.response.data)
        }
    }
)

export const get_products = createAsyncThunk(
    'product/get_products',
    async({parPage, page, searchValue}, {rejectWithValue, fulfillWithValue}) => {
        try{
            const {data} = await api.get(`/products-get?page=${page}&&searchValue=${searchValue}&&parPage=${parPage}`, {withCredentials: true})
            return fulfillWithValue(data)
        }catch(error){
            return rejectWithValue(error.response.data)
        }
    }
)

export const get_product = createAsyncThunk(
    'product/get_product',
    async(productId, {rejectWithValue, fulfillWithValue}) => {
        try{
            const {data} = await api.get(`/product-get/${productId}`, {withCredentials: true})
            return fulfillWithValue(data)
        }catch(error){
            return rejectWithValue(error.response.data)
        }
    }
)

export const update_product = createAsyncThunk(
    "product/update_product",
    async(product, {rejectWithValue, fulfillWithValue}) => {
        try {
            const {data} = await api.post("/product-update", product, {withCredentials: true})
            return fulfillWithValue(data)
        }catch(error){
            return rejectWithValue(error.response.data)
        }
    }
)

export const product_image_update = createAsyncThunk(
    'product/product_image_update',
    async({oldImage, newImage, productId, imageType = 'product'}, {rejectWithValue, fulfillWithValue}) => {
        try{
            const formData = new FormData()
            formData.append('oldImage', oldImage)
            formData.append('newImage', newImage)
            formData.append('productId', productId)
            formData.append('imageType', imageType)
            const {data} = await api.post('/product-image-update', formData, {withCredentials: true})
            return fulfillWithValue(data)
        }catch(error){
            return rejectWithValue(error.response.data)
        }
    }
)

export const deleteProduct = createAsyncThunk(
    'product/deleteProduct',
    async(id, {rejectWithValue}) => {
        try{
            const response = await api.delete(`/product/${id}`, {withCredentials: true})
            return response.data
        }catch(error){
            console.log(error)
            return rejectWithValue(error.response.data.message)
        }
    }
)

export const productReducer = createSlice({
    name: 'product',
    initialState: {
        successMessage: '',
        errorMessage: '',
        loader: false,
        products: [],
        product: "",
        totalProduct: 0
    },
    reducers: {
        messageClear: (state, _) => {
            state.errorMessage = ""
            state.successMessage = ""
        }
    },
    extraReducers: (builder) => {
        builder
        .addCase(add_product.pending, (state, {payload}) => {
            state.loader = true;
        })
        .addCase(add_product.rejected, (state, {payload}) => {
            state.loader = false;
            state.errorMessage = payload.error
        })
        .addCase(add_product.fulfilled, (state, {payload}) => {
            state.loader = false;
            state.successMessage = payload.message;
        })

        .addCase(get_products.fulfilled, (state, {payload}) => {
            state.loader = false;
            state.totalProduct = payload.totalProduct;
            state.products = payload.products;
        })
        .addCase(get_products.rejected, (state, {payload}) => {
            state.loader = false;
            state.errorMessage = payload.error
        })
        .addCase(get_products.pending, (state, {payload}) => {
            state.loader = true;
        })

        .addCase(get_product.fulfilled, (state, {payload}) => {
            state.loader = false;
            state.product = payload.product;
        })
        .addCase(get_product.rejected, (state, {payload}) => {
            state.loader = false;
            state.errorMessage = payload.error;
        })
        .addCase(get_product.pending, (state, {payload}) => {
            state.loader = true;
        })

        .addCase(update_product.pending, (state, {payload}) => {
            state.loader = true;
        })
        .addCase(update_product.rejected, (state, {payload}) => {
            state.loader = false;
            state.errorMessage = payload.error;
        })
        .addCase(update_product.fulfilled, (state, {payload}) => {
            state.loader = false;
            state.product = payload.product;
            state.successMessage = payload.message;
        })
        
        .addCase(product_image_update.fulfilled, (state, {payload}) => {
            state.product = payload.product;
            state.successMessage = payload.message;
            state.loader = false;
        })
        .addCase(product_image_update.pending, (state, {payload}) => {
            state.loader = true
        })
        .addCase(product_image_update.rejected, (state, {payload}) => {
            state.loader = false;
            state.errorMessage = payload.errorMessage;
        })

        .addCase(deleteProduct.pending, (state, {payload}) => {
            state.loader = true
        })
        .addCase(deleteProduct.fulfilled, (state, action) => {
            state.products = state.products.filter(product => product._id !== action.meta.arg);
            state.successMessage = action.payload.message;
            state.loader = false;
        })
        .addCase(deleteProduct.rejected, (state, action) => {
            state.loader = false;
            state.errorMessage = action.payload
        })
    }
})

export const {messageClear} = productReducer.actions
export default productReducer.reducer