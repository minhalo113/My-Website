import axios from 'axios';
import crypto from 'crypto';
import moment from 'moment';
import apiTokenModel from '../../../models/apiTokenModel.js';

class AliExpressProvider {
    constructor() {
        this.name = 'AliExpress';
        this.baseUrl = 'https://api-sg.aliexpress.com/sync';
        this.tokenUrl = 'https://oauth.aliexpress.com/token'; // Or use global endpoint
    }

    async getCredentials(method) {
        const appKey = process.env.ALIEXPRESS_APP_KEY || process.env.APP_KEY;
        const appSecret = process.env.ALIEXPRESS_APP_SECRET || process.env.APP_SECRET;

        if (method === 'aliexpress.ds.product.get') {
            appKey = process.env.APP_KEY;
            appSecret = process.env.APP_SECRET;
        }
        const trackingId = 'default';

        if (!appKey || !appSecret) {
            console.error('[AliExpressProvider] Missing credentials (ALIEXPRESS_APP_KEY/APP_KEY or ALIEXPRESS_APP_SECRET/APP_SECRET)');
            return null;
        }

        let accessToken = null;

        try {
            const tokenDoc = await apiTokenModel.findOne({ provider: 'aliexpress' });
            if (tokenDoc) {
                accessToken = tokenDoc.accessToken;
            }
        } catch (err) {
            console.error('[AliExpressProvider] Error reading token from DB:', err.message);
        }

        if (!accessToken) {
            await this.refreshAccessToken();
            accessToken = await apiTokenModel.findOne({ provider: 'aliexpress' });
        }

        return { appKey, appSecret, trackingId, accessToken };
    }

    signRequest(params, appSecret) {
        const sortedKeys = Object.keys(params).sort();
        let query = '';

        for (const key of sortedKeys) {
            if (params[key] !== undefined && params[key] !== null) {
                query += key + params[key];
            }
        }

        return crypto.createHmac('sha256', appSecret)
            .update(query, 'utf8')
            .digest('hex')
            .toUpperCase();
    }

    async refreshAccessToken() {
        console.log('[AliExpressProvider] Attempting to refresh access token...');
        const appKey = process.env.ALIEXPRESS_APP_KEY || process.env.APP_KEY;
        const appSecret = process.env.ALIEXPRESS_APP_SECRET || process.env.APP_SECRET;

        let refreshToken = process.env.ALIEXPRESS_REFRESH_TOKEN || process.env.REFRESH_TOKEN;

        try {
            const tokenDoc = await apiTokenModel.findOne({ provider: 'aliexpress' });
            if (tokenDoc && tokenDoc.refreshToken) {
                refreshToken = tokenDoc.refreshToken;
            }
        } catch (err) {
            console.error('[AliExpressProvider] DB Error during refresh:', err.message);
        }

        if (!refreshToken) {
            console.error('[AliExpressProvider] No refresh token available in DB or ENV.');
            return false;
        }

        try {
            const response = await axios.post('https://oauth.aliexpress.com/token', new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: appKey,
                client_secret: appSecret,
                refresh_token: refreshToken
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const data = response.data;
            if (data.access_token) {
                console.log('[AliExpressProvider] Token refreshed successfully.');

                // Save to DB
                await apiTokenModel.findOneAndUpdate(
                    { provider: 'aliexpress' },
                    {
                        accessToken: data.access_token,
                        refreshToken: data.refresh_token || refreshToken,
                        expiresAt: moment().add(data.expires_in, 'seconds').toDate(),
                        updatedAt: new Date()
                    },
                    { upsert: true, new: true }
                );
                return true;
            } else {
                console.error('[AliExpressProvider] Refresh failed. Response:', data);
                return false;
            }

        } catch (error) {
            console.error('[AliExpressProvider] Error refreshing token:', error.message);
            if (error.response) console.error(error.response.data);
            return false;
        }
    }

    async makeRequest(method, businessParams, isRetry = false) {
        let creds = await this.getCredentials();
        if (method === 'aliexpress.ds.product.get') {
            creds.appKey = process.env.APP_KEY;
            creds.appSecret = process.env.APP_SECRET;
        }
        if (!creds) return null;

        const systemParams = {
            app_key: creds.appKey,
            timestamp: String(Date.now()),
            format: 'json',
            v: '2.0',
            sign_method: 'sha256',
            method: method,
        };

        if (creds.accessToken) {
            systemParams.session = creds.accessToken;
        }

        const allParams = { ...systemParams, ...businessParams };
        allParams.sign = this.signRequest(allParams, creds.appSecret);

        const params = new URLSearchParams(allParams);

        try {
            const response = await axios.post(this.baseUrl, params.toString(), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
                }
            });

            if (!response.data) {
                console.error(response);
                return null;
            }
            const err = response.data.error_response;
            if (err) {
                if (!isRetry && (err.code === 27 || err.msg?.includes('Session') || err.sub_msg?.includes('expired'))) {
                    console.log(`[AliExpressProvider] Session expired (Code: ${err.code}). Refreshing...`);
                    const refreshed = await this.refreshAccessToken();
                    if (refreshed) {
                        return this.makeRequest(method, businessParams, true);
                    }
                }

                console.error(`[AliExpressProvider] API Error: ${JSON.stringify(err)}`);
                return null;
            }

            return response.data;

        } catch (error) {
            console.error(`[AliExpressProvider] Network/Request Error: ${error.message}`);
            return null;
        }
    }

    async generateAffiliateLink(url) {
        const creds = await this.getCredentials();
        if (!creds || !creds.trackingId) return url;

        const response = await this.makeRequest('aliexpress.affiliate.link.generate', {
            source_values: url,
            promotion_link_type: 0,
            tracking_id: creds.trackingId
        });

        if (response && response.aliexpress_affiliate_link_generate_response &&
            response.aliexpress_affiliate_link_generate_response.resp_result &&
            response.aliexpress_affiliate_link_generate_response.resp_result.result &&
            response.aliexpress_affiliate_link_generate_response.resp_result.result.promotion_links &&
            response.aliexpress_affiliate_link_generate_response.resp_result.result.promotion_links.promotion_link) {

            return response.aliexpress_affiliate_link_generate_response.resp_result.result.promotion_links.promotion_link[0].promotion_link;
        }

        return url;
    }

    async fetchProductDetails(sourceId) {
        const creds = await this.getCredentials();
        if (!creds) return null;

        const businessParams = {
            product_ids: sourceId,
            target_currency: 'USD',
            target_language: 'EN',
        };

        if (creds.trackingId) {
            businessParams.tracking_id = creds.trackingId;
        }

        const data = await this.makeRequest('aliexpress.affiliate.product.detail.get', businessParams);

        if (!data || !data.aliexpress_affiliate_product_detail_get_response ||
            !data.aliexpress_affiliate_product_detail_get_response.resp_result ||
            !data.aliexpress_affiliate_product_detail_get_response.resp_result.result ||
            !data.aliexpress_affiliate_product_detail_get_response.resp_result.result.products ||
            !data.aliexpress_affiliate_product_detail_get_response.resp_result.result.products.product ||
            data.aliexpress_affiliate_product_detail_get_response.resp_result.result.products.product.length === 0) {
            return null;
        }

        const item = data.aliexpress_affiliate_product_detail_get_response.resp_result.result.products.product[0];

        const images = [item.product_main_image_url];
        if (item.product_small_image_urls && item.product_small_image_urls.string) {
            const smallImgs = Array.isArray(item.product_small_image_urls.string)
                ? item.product_small_image_urls.string
                : [item.product_small_image_urls.string];
            images.push(...smallImgs);
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
            stock: 1, // Assume available if returned
            link: item.product_detail_url,
            discount: item.discount,
            videos: item.product_video_url ? [item.product_video_url] : undefined
        };
    }

    async fetchProducts() {
        const creds = await this.getCredentials();
        if (!creds) return [];

        const keywords = [
            "Anime Figure",
            "Scale Statue",
            "Nendoroid",
            "Figma",
            "Pop Up Parade",
            "Kotobukiya",
            "SH Figuarts",
            "Genshin Impact Figure",
            "One Piece Figure",
            "Miku Figure"
        ];

        const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
        const pageNo = Math.floor(Math.random() * 10) + 1;

        console.log(`[AliExpressProvider] Searching for "${randomKeyword}" (Page ${pageNo})`);

        const businessParams = {
            keywords: randomKeyword,
            target_currency: 'USD',
            target_language: 'EN',
            page_no: pageNo,
            page_size: 40,
            sort: 'LAST_VOLUME_DESC',
        };

        if (creds.trackingId) {
            businessParams.tracking_id = creds.trackingId;
        }
        const data = await this.makeRequest('aliexpress.affiliate.product.query', businessParams);

        if (!data || !data.aliexpress_affiliate_product_query_response ||
            !data.aliexpress_affiliate_product_query_response.resp_result ||
            !data.aliexpress_affiliate_product_query_response.resp_result.result ||
            !data.aliexpress_affiliate_product_query_response.resp_result.result.products ||
            !data.aliexpress_affiliate_product_query_response.resp_result.result.products.product) {
            return [];
        }

        const products = data.aliexpress_affiliate_product_query_response.resp_result.result.products.product;
        console.log(products)

        return products.map(item => {
            const images = [item.product_main_image_url];
            if (item.product_small_image_urls && item.product_small_image_urls.string) {
                const smallImgs = Array.isArray(item.product_small_image_urls.string)
                    ? item.product_small_image_urls.string
                    : [item.product_small_image_urls.string];
                images.push(...smallImgs);
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
                discount: item.discount,
                videos: item.product_video_url ? [item.product_video_url] : undefined
            };
        });
    }

    async getDSProduct(productId, shipTo = 'CA', currency = 'CAD') {
        const creds = await this.getCredentials();
        if (!creds) throw new Error('Missing AliExpress credentials');

        const businessParams = {
            ship_to_country: shipTo,
            product_id: productId,
            target_currency: currency,
        };

        const data = await this.makeRequest('aliexpress.ds.product.get', businessParams);

        if (!data) {
            throw new Error('Failed to fetch product data (No response)');
        }

        return data;
    }
}

export default new AliExpressProvider();
