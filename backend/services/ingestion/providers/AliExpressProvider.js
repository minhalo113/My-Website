import axios from 'axios';
import crypto from 'crypto';
import moment from 'moment';
import apiTokenModel from '../../../models/apiTokenModel.js';

const BASE_URL_GATEWAY = 'https://api-sg.aliexpress.com/sync';
const BASE_URL_REST = 'https://api-sg.aliexpress.com/rest';

class AliExpressProvider {
    constructor() {
        this.name = 'AliExpress';
    }
    _getEnvCreds(type = 'AFF') {
        if (type === 'DS') {
            return {
                appKey: process.env.APP_KEY,
                appSecret: process.env.APP_SECRET,
                trackingId: null,
                refreshToken: process.env.REFRESH_TOKEN
            };
        }

        return {
            appKey: process.env.ALIEXPRESS_APP_KEY,
            appSecret: process.env.ALIEXPRESS_APP_SECRET,
            trackingId: 'default',
            refreshToken: process.env.ALIEXPRESS_REFRESH_TOKEN
        };
    }

    signRequest(apiPath, params, appSecret) {

        const sortedKeys = Object.keys(params).sort();

        let query = '';

        if (apiPath && apiPath.includes('/')) {
            query += apiPath;
        }
        for (const key of sortedKeys) {
            const value = params[key];
            if (value !== undefined && value !== null && value !== '') {
                query += key + String(value);
            }
        }

        return crypto.createHmac('sha256', appSecret)
            .update(query, 'utf8')
            .digest('hex')
            .toUpperCase();
    }

    async refreshAccessToken(type = 'AFF') {
        console.log(`[AliExpress] Refreshing token for type: ${type}...`);

        const creds = this._getEnvCreds(type);
        let currentRefreshToken = creds.refreshToken;

        try {
            const tokenDoc = await apiTokenModel.findOne({ provider: 'aliexpress' });
            if (tokenDoc?.refreshToken) {
                currentRefreshToken = tokenDoc.refreshToken;
            }
        } catch (err) {
            console.error('[AliExpress] DB Error:', err.message);
        }

        if (!currentRefreshToken) {
            console.error('[AliExpress] No refresh token found.');
            return null;
        }

        const apiPath = '/auth/token/refresh';
        const timestamp = String(Date.now());

        const params = {
            app_key: creds.appKey,
            timestamp: timestamp,
            sign_method: 'sha256',
            refresh_token: currentRefreshToken,
            partner_id: 'iop-sdk-nodejs-2025',
            method: 'aliexpress.auth.token.refresh',
            v: '2.0',
            format: 'json',
            simplify: 'true'
        };

        params.sign = this.signRequest(apiPath, params, creds.appSecret);

        try {
            const response = await axios.post(BASE_URL_REST + apiPath, new URLSearchParams(params), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }
            });

            const data = response.data;

            if (data.code && data.code !== '0') {
                console.error('[AliExpress] Refresh Logic Failed:', data);
                return null;
            }
            if (data.access_token) {
                console.log('[AliExpress] Token refreshed successfully.');

                await apiTokenModel.findOneAndUpdate(
                    { provider: 'aliexpress' },
                    {
                        accessToken: data.access_token,
                        refreshToken: data.refresh_token || currentRefreshToken,
                        expiresAt: moment().add(data.expires_in, 'seconds').toDate(),
                        updatedAt: new Date()
                    },
                    { upsert: true, new: true }
                );
                return data.access_token;
            }

            console.error('[AliExpress] Refresh returned weird data:', data);
            return null;

        } catch (error) {
            console.error('[AliExpress] Refresh Network Error:', error.response?.data || error.message);
            return null;
        }
    }

    async execute({ apiMethod, params, type = 'AFF', authRequired = false, isRetry = false }) {
        const creds = this._getEnvCreds(type);
        if (!creds.appKey) throw new Error(`Missing credentials for type ${type}`);

        let session = null;
        if (authRequired) {
            const tokenDoc = await apiTokenModel.findOne({ provider: 'aliexpress' });
            session = tokenDoc?.accessToken;

            if (!session) {
                session = await this.refreshAccessToken(type);
            }
            if (!session) throw new Error('Authentication required but failed to get token.');
        }

        const systemParams = {
            app_key: creds.appKey,
            timestamp: String(Date.now()),
            format: 'json',
            v: '2.0',
            sign_method: 'sha256'
        };

        if (session) {
            systemParams.session = session;
        }

        const isRestCall = apiMethod.startsWith('/');
        let url = '';
        let apiPathForSign = '';

        if (isRestCall) {
            url = BASE_URL_REST + apiMethod;
            apiPathForSign = apiMethod;
        } else {
            url = BASE_URL_GATEWAY;
            systemParams.method = apiMethod;
            apiPathForSign = '';
        }

        const allParams = { ...systemParams, ...params };
        allParams.sign = this.signRequest(apiPathForSign, allParams, creds.appSecret);

        try {
            const response = await axios.post(url, new URLSearchParams(allParams), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' }
            });

            const data = response.data;
            const err = data.error_response;

            if (err) {
                if (!isRetry && (err.code === 27 || err.msg?.includes('Session') || err.sub_msg?.includes('expired'))) {
                    console.log(`[AliExpress] Session expired (${err.code}). Retrying...`);
                    const newToken = await this.refreshAccessToken(type);
                    if (newToken) {
                        return this.execute({ apiMethod, params, type, authRequired, isRetry: true });
                    }
                }
                console.error(`[AliExpress] API Error [${apiMethod}]:`, JSON.stringify(err));
                return null;
            }

            return data;

        } catch (error) {
            console.error(`[AliExpress] Network Error [${apiMethod}]:`, error.message);
            return null;
        }
    }

    async getDSProduct(productId, shipTo = 'CA', currency = 'CAD') {
        return this.execute({
            apiMethod: 'aliexpress.ds.product.get',
            type: 'DS',
            authRequired: true,
            params: {
                product_id: productId,
                ship_to_country: shipTo,
                target_currency: currency
            }
        });
    }

    async generateAffiliateLink(url) {
        const creds = this._getEnvCreds('AFF');
        const res = await this.execute({
            apiMethod: 'aliexpress.affiliate.link.generate',
            type: 'AFF',
            authRequired: false,
            params: {
                source_values: url,
                promotion_link_type: 0,
                tracking_id: creds.trackingId
            }
        });

        return res?.aliexpress_affiliate_link_generate_response?.resp_result?.result?.promotion_links?.promotion_link?.[0]?.promotion_link || url;
    }
    async fetchProducts() {
        const creds = this._getEnvCreds('AFF');
        const keywords = ["Anime Figure",
            "Scale Statue",
            "Nendoroid",
            "Figma",
            "Pop Up Parade",
            "Kotobukiya",
            "SH Figuarts",
            "Genshin Impact Figure",
            "One Piece Figure",
            "Miku Figure"];
        const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];

        console.log(`[AliExpress] Searching: ${randomKeyword}`);

        const res = await this.execute({
            apiMethod: 'aliexpress.affiliate.product.query',
            type: 'AFF',
            authRequired: false,
            params: {
                keywords: randomKeyword,
                target_currency: 'USD',
                page_no: Math.floor(Math.random() * 20) + 1,
                page_size: 10,
                sort: 'LAST_VOLUME_DESC',
                tracking_id: creds.trackingId
            }
        });

        const products = res?.aliexpress_affiliate_product_query_response?.resp_result?.result?.products?.product || [];

        // Map data
        return products.map(item => this._mapAffiliateProduct(item));
    }

    async fetchProductDetails(sourceId) {
        const creds = this._getEnvCreds('AFF');
        const res = await this.execute({
            apiMethod: 'aliexpress.affiliate.productdetail.get',
            type: 'AFF',
            authRequired: false,
            params: {
                product_ids: sourceId,
                target_currency: 'USD',
                target_language: 'EN',
                tracking_id: creds.trackingId
            }
        });
        const item = res?.aliexpress_affiliate_productdetail_get_response?.resp_result?.result?.products?.product?.[0];
        if (!item) return null;
        return this._mapAffiliateProduct(item);
    }

    _mapAffiliateProduct(item) {
        let images = [item.product_main_image_url];
        if (item.product_small_image_urls?.string) {
            const small = Array.isArray(item.product_small_image_urls.string)
                ? item.product_small_image_urls.string
                : [item.product_small_image_urls.string];
            images.push(...small);
        }

        return {
            name: item.product_title,
            price: parseFloat(item.target_sale_price || item.target_original_price),
            currency: item.target_sale_price_currency || 'USD',
            images: images,
            description: `AliExpress Product: ${item.product_title}`,
            affiliateLink: item.promotion_link || item.product_url,
            productType: 'affiliate',
            category: 'Aliexpress',
            sourceId: item.product_id.toString(),
            stock: 1,
            link: item.product_detail_url,
            discount: item.discount
        };
    }
}

export default new AliExpressProvider();