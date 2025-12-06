import fetch from 'node-fetch';

class EbayProvider {
    constructor() {
        this.name = 'eBay';
        this.baseUrl = 'https://api.ebay.com';
        this.token = null;
        this.tokenExpiration = null;
    }

    async getAccessToken() {
        if (this.token && this.tokenExpiration && Date.now() < this.tokenExpiration - 300000) {
            return this.token;
        }

        const clientId = process.env.EBAY_APP_ID;
        const clientSecret = process.env.EBAY_CERT_ID;

        if (!clientId || !clientSecret) {
            console.error('[EbayProvider] Missing credentials (EBAY_APP_ID or EBAY_CERT_ID)');
            return null;
        }

        const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

        try {
            const response = await fetch(`${this.baseUrl}/identity/v1/oauth2/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Basic ${credentials}`
                },
                body: 'grant_type=client_credentials&scope=https://api.ebay.com/oauth/api_scope'
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Auth failed: ${response.status} ${error}`);
            }

            const data = await response.json();
            this.token = data.access_token;
            this.tokenExpiration = Date.now() + (data.expires_in * 1000);

            return this.token;
        } catch (error) {
            console.error('[EbayProvider] Error fetching access token:', error);
            return null;
        }
    }

    generateAffiliateLink(item) {
        const rawUrl = item.itemWebUrl;

        if (rawUrl && (rawUrl.includes('campid') || rawUrl.includes('mkcid'))) {
            return rawUrl;
        }

        const campaignId = process.env.EBAY_CAMPAIGN_ID;
        const customId = process.env.EBAY_CUSTOM_ID || 'CUSTOM';
        const itemId = item.itemId.split('|')[1] || item.itemId;

        let legacyItemId = item.itemId;
        if (legacyItemId.startsWith('v1|')) {
            const parts = legacyItemId.split('|');
            if (parts.length >= 2) {
                legacyItemId = parts[1];
            }
        }

        if (!campaignId) {
            // Fallback to raw URL if no campaign ID
            return rawUrl;
        }

        return `https://www.ebay.com/itm/${legacyItemId}?mkcid=1&mkrid=711-53200-19255-0&siteid=0&campid=${campaignId}&toolid=10001&mkevt=1`;
    }

    async searchProducts() {
        const token = await this.getAccessToken();
        if (!token) return [];

        const randomOffset = Math.floor(Math.random() * 201); // 0-200
        const query = 'Anime Figure'; // The prompt mentions "Anime Figure", "Scale Statue". Let's use "Anime Figure". 
        // Or maybe "(Anime Figure, Scale Statue)" syntax if eBay supports OR? eBay uses syntax like `(A,B)`.

        const q = '(Anime Figure, Scale Statue)';

        const searchUrl = new URL(`${this.baseUrl}/buy/browse/v1/item_summary/search`);
        searchUrl.searchParams.append('q', q);
        searchUrl.searchParams.append('filter', 'price:[50..1000],priceCurrency:USD,buyingOptions:{FIXED_PRICE},condition:{NEW}');
        searchUrl.searchParams.append('sort', '-listDate');
        searchUrl.searchParams.append('limit', '50');
        searchUrl.searchParams.append('offset', randomOffset.toString());

        const headers = {
            'Authorization': `Bearer ${token}`,
            'X-EBAY-C-MARKETPLACE-ID': 'EBAY_US',
            'Content-Type': 'application/json'
        };

        const campaignId = process.env.EBAY_CAMPAIGN_ID;
        const customId = process.env.EBAY_CUSTOM_ID || 'CUSTOM';
        if (campaignId) {
            headers['X-EBAY-C-ENDUSERCTX'] = `affiliateCampaignId=${campaignId},affiliateReferenceId=${customId}`;
        }

        try {
            const response = await fetch(searchUrl.toString(), { headers });

            if (!response.ok) {
                console.error(`[EbayProvider] Search failed: ${response.status}`);
                const txt = await response.text();
                console.error(txt);
                return [];
            }

            const data = await response.json();

            if (!data.itemSummaries) return [];

            return data.itemSummaries.map(item => {
                const affiliateLink = this.generateAffiliateLink(item);

                const images = [];
                if (item.image && item.image.imageUrl) {
                    images.push(item.image.imageUrl);
                }
                if (item.additionalImages) {
                    item.additionalImages.forEach(img => {
                        if (img.imageUrl) images.push(img.imageUrl);
                    });
                }

                const priceValue = item.price ? parseFloat(item.price.value) : 0;
                const currency = item.price ? item.price.currency : 'USD';

                const sourceId = item.itemId;
                const description = item.shortDescription || item.title;

                return {
                    name: item.title,
                    price: priceValue,
                    currency: currency,
                    images: images,
                    description: description,
                    affiliateLink: affiliateLink,
                    productType: 'affiliate',
                    sourceId: sourceId,
                    stock: 1,
                    link: item.itemWebUrl
                };
            });

        } catch (error) {
            console.error('[EbayProvider] Error searching products:', error);
            return [];
        }
    }

    async fetchProducts() {
        return await this.searchProducts();
    }
}

export default new EbayProvider();
