import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import api from "../../api/api";
import { MdImageSearch } from "react-icons/md";

export const trigger_ingestion = createAsyncThunk(
    'product/trigger_ingestion',
    async (provider = null, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.post('/product-ingest', { provider }, { withCredentials: true })
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const add_product = createAsyncThunk(
    'product/add_product',
    async (product, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.post('/product-add', product, { withCredentials: true })
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const generate_product_social_preview = createAsyncThunk(
    'product/generate_product_social_preview',
    async (payload, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.post('/product-social-preview', payload, { withCredentials: true });
            return fulfillWithValue(data);
        } catch (error) {
            const responsePayload = error?.response?.data || { error: 'Failed to generate social post preview' };
            return rejectWithValue(responsePayload);
        }
    }
)

export const publish_product_social_post = createAsyncThunk(
    'product/publish_product_social_post',
    async (formData, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.post('/product-social-publish', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return fulfillWithValue(data);
        } catch (error) {
            const responsePayload = error?.response?.data || { error: 'Failed to publish social post' };
            return rejectWithValue(responsePayload);
        }
    }
)

export const import_aliexpress_product = createAsyncThunk(
    'product/import_aliexpress_product',
    async (url, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.post('/product-import-aliexpress', { url }, { withCredentials: true })
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const get_products = createAsyncThunk(
    'product/get_products',
    async ({ parPage, page, searchValue, minPrice, maxPrice }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const params = new URLSearchParams()
            if (page !== undefined && page !== null) {
                params.append('page', page)
            }
            if (searchValue !== undefined && searchValue !== null) {
                params.append('searchValue', searchValue)
            }
            if (parPage !== undefined && parPage !== null) {
                params.append('parPage', parPage)
            }
            if (minPrice !== undefined && minPrice !== null) {
                params.append('minPrice', minPrice)
            }
            if (maxPrice !== undefined && maxPrice !== null) {
                params.append('maxPrice', maxPrice)
            }

            const query = params.toString()
            const url = query ? `/products-get?${query}` : '/products-get'
            const { data } = await api.get(url, { withCredentials: true })
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const get_product = createAsyncThunk(
    'product/get_product',
    async (productId, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.get(`/product-get/${productId}`, { withCredentials: true })
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const update_product = createAsyncThunk(
    "product/update_product",
    async (product, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.post("/product-update", product, { withCredentials: true })
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const product_image_update = createAsyncThunk(
    'product/product_image_update',
    async ({ oldImage, newImage, productId, imageType = 'product', action = 'update' }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const formData = new FormData()
            formData.append('oldImage', oldImage)
            if (newImage) {
                formData.append('newImage', newImage)
            }
            formData.append('productId', productId)
            formData.append('imageType', imageType)
            formData.append('action', action)
            const { data } = await api.post('/product-image-update', formData, { withCredentials: true })
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)
export const search_product_by_image = createAsyncThunk(
    'product/search_product_by_image',
    async ({ imageFile, threshold }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const formData = new FormData();
            formData.append('image', imageFile);
            const numericThreshold = Number(threshold);
            if (!Number.isNaN(numericThreshold)) {
                formData.append('threshold', numericThreshold);
            }
            const { data } = await api.post('/product-image-search', formData, { withCredentials: true })
            return fulfillWithValue(data)
        } catch (error) {
            const payload = error?.response?.data || { error: 'Failed to search product images' }
            return rejectWithValue(payload)
        }
    }
)

export const check_product_images_for_duplicates = createAsyncThunk(
    'product/check_product_images_for_duplicates',
    async (formData, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.post('/product-image-precheck', formData, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            return fulfillWithValue(data)
        } catch (error) {
            const payload = error?.response?.data || { error: 'Failed to check product images' }
            return rejectWithValue(payload)
        }
    }
)

export const product_visibility = createAsyncThunk(
    'product/product_visibility',
    async ({ productId, isHidden }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.post('/product-visibility', { productId, isHidden }, { withCredentials: true })
            return fulfillWithValue(data)
        } catch (error) {
            return rejectWithValue(error.response.data)
        }
    }
)

export const deleteProduct = createAsyncThunk(
    'product/deleteProduct',
    async (id, { rejectWithValue }) => {
        try {
            const response = await api.delete(`/product/${id}`, { withCredentials: true })
            return response.data
        } catch (error) {
            return rejectWithValue(error.response.data.message)
        }
    }
)

export const fetch_product_reviews = createAsyncThunk(
    'product/fetch_product_reviews',
    async (productId, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.get(`/product/${productId}/reviews`, { withCredentials: true });
            return fulfillWithValue({ productId, ...data });
        } catch (error) {
            const payload = error?.response?.data || { error: 'Failed to load product reviews' };
            return rejectWithValue(payload);
        }
    }
);

export const create_fake_product_review = createAsyncThunk(
    'product/create_fake_product_review',
    async ({ productId, payload }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.post(`/product/${productId}/reviews`, payload, {
                withCredentials: true,
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            return fulfillWithValue({ productId, ...data });
        } catch (error) {
            const responsePayload = error?.response?.data || { error: 'Failed to add fake review' };
            return rejectWithValue(responsePayload);
        }
    }
);

export const update_product_review = createAsyncThunk(
    'product/update_product_review',
    async ({ productId, reviewId, payload }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.patch(`/product/${productId}/reviews/${reviewId}`, payload, { withCredentials: true });
            return fulfillWithValue({ productId, reviewId, ...data });
        } catch (error) {
            const responsePayload = error?.response?.data || { error: 'Failed to update review' };
            return rejectWithValue(responsePayload);
        }
    }
);

export const delete_product_review = createAsyncThunk(
    'product/delete_product_review',
    async ({ productId, reviewId }, { rejectWithValue, fulfillWithValue }) => {
        try {
            const { data } = await api.delete(`/product/${productId}/reviews/${reviewId}`, { withCredentials: true });
            return fulfillWithValue({ productId, reviewId, ...data });
        } catch (error) {
            const payload = error?.response?.data || { error: 'Failed to delete review' };
            return rejectWithValue(payload);
        }
    }
);

export const productReducer = createSlice({
    name: 'product',
    initialState: {
        successMessage: '',
        errorMessage: '',
        loader: false,
        products: [],
        product: "",
        totalProduct: 0,
        importedProduct: null,
        imageSearchResults: [],
        imageSearchMeta: null,
        imageSearchLoading: false,
        imageSearchMessage: '',
        preflightCheckLoading: false,
        preflightCheckResults: [],
        preflightCheckMessage: '',
        preflightCheckThreshold: 10,
        preflightCheckMatches: 0,
        reviewList: [],
        reviewLoader: false,
        selectedProductName: '',
        averageProductRating: 0,
        reviewCount: 0,
        socialPreview: null,
        socialPreviewLoading: false,
        socialPreviewError: '',
        socialPublishLoading: false,
        socialPublishResult: null,
        socialPublishError: '',
        ingestionLoading: false,
    },
    reducers: {
        messageClear: (state, _) => {
            state.errorMessage = ""
            state.successMessage = ""
            state.importedProduct = null
            state.imageSearchMessage = ''
            state.preflightCheckMessage = ''
            state.preflightCheckResults = []
            state.preflightCheckMatches = 0
            state.preflightCheckLoading = false
        },
        resetSocialPreview: (state) => {
            state.socialPreview = null;
            state.socialPreviewError = '';
            state.socialPreviewLoading = false;
            state.socialPublishLoading = false;
            state.socialPublishResult = null;
            state.socialPublishError = '';
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(trigger_ingestion.pending, (state) => {
                state.ingestionLoading = true;
            })
            .addCase(trigger_ingestion.rejected, (state, { payload }) => {
                state.ingestionLoading = false;
                state.errorMessage = payload.error;
            })
            .addCase(trigger_ingestion.fulfilled, (state, { payload }) => {
                state.ingestionLoading = false;
                state.successMessage = payload.message;
            })

            .addCase(add_product.pending, (state, { payload }) => {
                state.loader = true;
            })
            .addCase(add_product.rejected, (state, { payload }) => {
                state.loader = false;
                console.log(payload)
                state.errorMessage = payload.error
            })
            .addCase(add_product.fulfilled, (state, { payload }) => {
                state.loader = false;
                state.successMessage = payload.message;
            })

            .addCase(import_aliexpress_product.pending, (state) => {
                state.loader = true;
            })
            .addCase(import_aliexpress_product.rejected, (state, { payload }) => {
                state.loader = false;
                state.errorMessage = payload.error;
            })
            .addCase(import_aliexpress_product.fulfilled, (state, { payload }) => {
                state.loader = false;
                state.importedProduct = payload;
            })
            .addCase(generate_product_social_preview.pending, (state) => {
                state.socialPreviewLoading = true;
                state.socialPreviewError = '';
            })
            .addCase(generate_product_social_preview.fulfilled, (state, { payload }) => {
                state.socialPreviewLoading = false;
                state.socialPreview = payload?.preview || null;
                state.socialPreviewError = '';
            })
            .addCase(generate_product_social_preview.rejected, (state, { payload }) => {
                state.socialPreviewLoading = false;
                state.socialPreviewError = typeof payload === 'string' ? payload : (payload?.error || 'Failed to generate social post preview');
            })
            .addCase(publish_product_social_post.pending, (state) => {
                state.socialPublishLoading = true;
                state.socialPublishError = '';
                state.socialPublishResult = null;
            })
            .addCase(publish_product_social_post.fulfilled, (state, { payload }) => {
                state.socialPublishLoading = false;
                state.socialPublishResult = payload || null;
                state.socialPublishError = '';
            })
            .addCase(publish_product_social_post.rejected, (state, { payload }) => {
                state.socialPublishLoading = false;
                state.socialPublishError = typeof payload === 'string' ? payload : (payload?.error || 'Failed to publish social post');
            })
            .addCase(get_products.fulfilled, (state, { payload }) => {
                state.loader = false;
                state.totalProduct = payload.totalProduct;
                state.products = payload.products;
            })
            .addCase(get_products.rejected, (state, { payload }) => {
                state.loader = false;
                state.errorMessage = payload.error
            })
            .addCase(get_products.pending, (state, { payload }) => {
                state.loader = true;
            })

            .addCase(get_product.fulfilled, (state, { payload }) => {
                state.loader = false;
                state.product = payload.product;
            })
            .addCase(get_product.rejected, (state, { payload }) => {
                state.loader = false;
                state.errorMessage = payload.error;
            })
            .addCase(get_product.pending, (state, { payload }) => {
                state.loader = true;
            })

            .addCase(update_product.pending, (state, { payload }) => {
                state.loader = true;
            })
            .addCase(update_product.rejected, (state, { payload }) => {
                state.loader = false;
                state.errorMessage = payload.error;
            })
            .addCase(update_product.fulfilled, (state, { payload }) => {
                state.loader = false;
                state.product = payload.product;
                state.successMessage = payload.message;
            })

            .addCase(product_image_update.fulfilled, (state, { payload }) => {
                state.product = payload.product;
                state.successMessage = payload.message;
                state.loader = false;
            })
            .addCase(product_image_update.pending, (state, { payload }) => {
                state.loader = true
            })
            .addCase(product_image_update.rejected, (state, { payload }) => {
                state.loader = false;
                state.errorMessage = payload?.errorMessage || payload?.error || 'Failed to update product image';
            })
            .addCase(search_product_by_image.pending, (state) => {
                state.imageSearchLoading = true;
                state.errorMessage = '';
                state.imageSearchMessage = '';
            })
            .addCase(search_product_by_image.fulfilled, (state, { payload }) => {
                state.imageSearchLoading = false;
                state.imageSearchResults = payload.matches || [];
                state.imageSearchMeta = {
                    queryFingerprint: payload.queryFingerprint || '',
                    threshold: payload.threshold,
                    totalMatches: payload.totalMatches || 0,
                    rawMatchCount: payload.rawMatchCount || 0,
                    returnedMatches: (payload.matches || []).length,
                };
                const returned = state.imageSearchMeta.returnedMatches;
                const total = state.imageSearchMeta.totalMatches;
                const raw = state.imageSearchMeta.rawMatchCount;
                if (returned) {
                    const base = `Found ${returned} matching product${returned > 1 ? 's' : ''}`;
                    const capped = total && total > returned ? ` (showing top ${returned} of ${total})` : '';
                    const imageInfo = raw && raw > total ? ` across ${raw} similar image${raw === 1 ? '' : 's'}` : '';
                    state.imageSearchMessage = `${base}${capped}${imageInfo}.`;
                } else {
                    state.imageSearchMessage = 'No matching products found.';
                }
            })
            .addCase(search_product_by_image.rejected, (state, { payload }) => {
                state.imageSearchLoading = false;
                state.errorMessage = payload?.error || 'Failed to search product images';
            })
            .addCase(check_product_images_for_duplicates.pending, (state) => {
                state.preflightCheckLoading = true;
                state.preflightCheckResults = [];
                state.preflightCheckMessage = '';
                state.preflightCheckMatches = 0;
                state.errorMessage = '';
            })
            .addCase(check_product_images_for_duplicates.fulfilled, (state, { payload }) => {
                state.preflightCheckLoading = false;
                state.preflightCheckResults = payload?.results || [];
                state.preflightCheckThreshold = payload?.threshold ?? 10;
                state.preflightCheckMatches = payload?.totalMatches || 0;
                const successful = payload?.successfulQueries || 0;
                const total = payload?.totalQueries || 0;
                const matches = state.preflightCheckMatches;
                if (matches > 0) {
                    state.preflightCheckMessage = `Found ${matches} possible match${matches === 1 ? '' : 'es'} across ${successful || total} image${(successful || total) === 1 ? '' : 's'}.`;
                } else if (successful) {
                    state.preflightCheckMessage = 'No matching products found for the uploaded images.';
                } else {
                    state.preflightCheckMessage = 'Unable to analyze the uploaded images.';
                }
            })
            .addCase(check_product_images_for_duplicates.rejected, (state, { payload }) => {
                state.preflightCheckLoading = false;
                state.preflightCheckResults = [];
                state.preflightCheckMatches = 0;
                state.preflightCheckMessage = '';
                state.errorMessage = payload?.error || 'Failed to check product images';
            })
            .addCase(product_visibility.fulfilled, (state, { payload }) => {
                state.loader = false;
                state.successMessage = payload.message;
                state.products = state.products.map(p => p._id === payload.product._id ? payload.product : p);
            })
            .addCase(product_visibility.pending, (state) => {
                state.loader = true;
            })
            .addCase(product_visibility.rejected, (state, { payload }) => {
                state.loader = false;
                state.errorMessage = payload.error;
            })
            .addCase(fetch_product_reviews.pending, (state) => {
                state.reviewLoader = true;
            })
            .addCase(fetch_product_reviews.fulfilled, (state, { payload }) => {
                state.reviewLoader = false;
                state.reviewList = payload?.reviews || [];
                state.selectedProductName = payload?.product?.name || '';
                state.averageProductRating = payload?.averageRating ?? 0;
                state.reviewCount = payload?.reviewCount ?? state.reviewList.length;
            })
            .addCase(fetch_product_reviews.rejected, (state, { payload }) => {
                state.reviewLoader = false;
                state.errorMessage = typeof payload === 'string' ? payload : (payload?.error || 'Failed to load product reviews');
            })
            .addCase(create_fake_product_review.pending, (state) => {
                state.reviewLoader = true;
            })
            .addCase(create_fake_product_review.fulfilled, (state, { payload }) => {
                state.reviewLoader = false;
                if (payload?.review) {
                    state.reviewList = [payload.review, ...state.reviewList];
                }
                state.successMessage = payload?.message || 'Review added successfully.';
                if (payload?.averageRating !== undefined) {
                    state.averageProductRating = payload.averageRating;
                }
                if (payload?.reviewCount !== undefined) {
                    state.reviewCount = payload.reviewCount;
                }
            })
            .addCase(create_fake_product_review.rejected, (state, { payload }) => {
                state.reviewLoader = false;
                state.errorMessage = typeof payload === 'string' ? payload : (payload?.error || 'Failed to add fake review');
            })
            .addCase(update_product_review.pending, (state) => {
                state.reviewLoader = true;
            })
            .addCase(update_product_review.fulfilled, (state, { payload }) => {
                state.reviewLoader = false;
                if (payload?.review) {
                    state.reviewList = state.reviewList.map((item) =>
                        item._id === payload.review._id ? payload.review : item
                    );
                }
                state.successMessage = payload?.message || 'Review updated successfully.';
                if (payload?.averageRating !== undefined) {
                    state.averageProductRating = payload.averageRating;
                }
                if (payload?.reviewCount !== undefined) {
                    state.reviewCount = payload.reviewCount;
                }
            })
            .addCase(update_product_review.rejected, (state, { payload }) => {
                state.reviewLoader = false;
                state.errorMessage = typeof payload === 'string' ? payload : (payload?.error || 'Failed to update review');
            })
            .addCase(delete_product_review.pending, (state) => {
                state.reviewLoader = true;
            })
            .addCase(delete_product_review.fulfilled, (state, { payload, meta }) => {
                state.reviewLoader = false;
                const removedId = payload?.deletedReviewId || meta?.arg?.reviewId;
                if (removedId) {
                    state.reviewList = state.reviewList.filter((item) => item._id !== removedId);
                }
                state.successMessage = payload?.message || 'Review deleted successfully.';
                if (payload?.averageRating !== undefined) {
                    state.averageProductRating = payload.averageRating;
                }
                if (payload?.reviewCount !== undefined) {
                    state.reviewCount = payload.reviewCount;
                }
            })
            .addCase(delete_product_review.rejected, (state, { payload }) => {
                state.reviewLoader = false;
                state.errorMessage = typeof payload === 'string' ? payload : (payload?.error || 'Failed to delete review');
            })
            .addCase(deleteProduct.pending, (state, { payload }) => {
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

export const { messageClear, resetSocialPreview } = productReducer.actions
export default productReducer.reducer