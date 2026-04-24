import axios from "axios";

const DEFAULT_MODEL = "gpt-5-nano";
const DEFAULT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const SHOP_URL = "https://afigureaday.com/"

const normalizeList = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value
            .map((item) => (typeof item === 'string' ? item.trim() : ''))
            .filter((item) => item.length > 0);
    }
    if (typeof value === 'string') {
        return value
            .split(',')
            .map((item) => item.trim())
            .filter((item) => item.length > 0);
    }
    return [];
}

const buildImageSummary = (hints = []) => {
    const list = normalizeList(hints);
    if (!list.length) {
        return 'No specific image details were provided.';
    }
    if (list.length === 1) {
        return `The product photo includes ${list[0]}.`;
    }
    const initial = list.slice(0, -1).join(', ');
    const last = list[list.length - 1];
    return `The product photos include ${initial} and ${last}.`;
};

const formatPriceWithDiscount = (priceVal, discountVal) => {
    const p = parseFloat(priceVal);
    const d = parseFloat(discountVal) || 0;
    if (isNaN(p)) return '';

    if (d > 0) {
        const discounted = p - (p * d) / 100;
        return `$${discounted.toFixed(2)} (${d}% off! Original Price: $${p.toFixed(2)})`;
    }
    return `$${p.toFixed(2)}`;
};

const buildPriceString = (price, discount, colorPrices) => {
    let hasOptions = false;
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    if (colorPrices) {
        // colorPrices format is usually "Option 1: 10, Option 2: 20" or just an array
        const entries = String(colorPrices).split(',').map(e => e.trim()).filter(Boolean);
        if (entries.length > 0) {
            hasOptions = true;
            for (const entry of entries) {
                const parts = entry.split(':');
                const priceStr = parts.length > 1 ? parts[1].trim() : parts[0].trim();
                const p = parseFloat(priceStr);
                if (!isNaN(p)) {
                    if (p < minPrice) minPrice = p;
                    if (p > maxPrice) maxPrice = p;
                }
            }
        }
    }

    const d = parseFloat(discount) || 0;

    if (hasOptions && minPrice !== Infinity && maxPrice !== -Infinity) {
        if (minPrice !== maxPrice) {
            if (d > 0) {
                const minDiscounted = minPrice - (minPrice * d) / 100;
                const maxDiscounted = maxPrice - (maxPrice * d) / 100;
                return `Price: $${minDiscounted.toFixed(2)} - $${maxDiscounted.toFixed(2)} (${d}% off! Original Price: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)})`;
            }
            return `Price: $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`;
        } else {
            if (d > 0) {
                const discounted = minPrice - (minPrice * d) / 100;
                return `Price: $${discounted.toFixed(2)} (${d}% off! Original Price: $${minPrice.toFixed(2)})`;
            }
            return `Price: $${minPrice.toFixed(2)}`;
        }
    }

    return '';
};

export const generateProductSocialCopy = async ({
    title,
    description,
    imageHints = [],
    brand,
    productUrl,
    price,
    discount,
    colorPrices,
}) => {
    const trimmedTitle = typeof title === 'string' ? title.trim() : '';
    const trimmedDescription = typeof description === 'string' ? description.trim() : '';
    // const trimmedBrand = typeof brand === 'string' ? brand.trim() : '';
    //const trimmedUrl = typeof productUrl === 'string' ? productUrl.trim() : '';

    if (!trimmedTitle || !trimmedDescription) {
        throw new Error('A product title and description are required');
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        throw new Error('OpenAI API key is not configured');
    }

    const systemPrompt = `You are a marketing assistant helping to promote ecommerce products on Instagram and Facebook.\n\nRespond strictly with a JSON object using this schema:\n{\n  "headline": string,              // punchy, 6-12 words, suitable as post opener\n  "caption": string,               // energetic 2-3 sentence caption highlighting the product benefits\n  "callToAction": string,          // brief imperative encouraging viewers to act, remember to include the shop URL\n  "hashtags": string[]             // 6-10 high-intent hashtags without the # symbol\n}\n\nKeep the tone upbeat, concise, and platform-ready. Avoid emojis unless already provided.`;

    const parts = [
        `Product title: ${trimmedTitle}`,
        `Product description:\n${trimmedDescription}`
        // buildImageSummary(imageHints),
    ];

    // if (trimmedBrand) {
    //     parts.push(`Brand name: ${trimmedBrand}`);
    // }
    // if (trimmedUrl) {
    //     parts.push(`Product URL: ${trimmedUrl}`);
    // }
    parts.push(`Shop URL: ${SHOP_URL}`)

    const payload = {
        model: DEFAULT_MODEL,
        temperature: 1,
        response_format: { type: 'json_object' },
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: parts.join('\n\n') },
        ],
    };

    const { data } = await axios.post(DEFAULT_ENDPOINT, payload, {
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
    });

    const message = data?.choices?.[0]?.message?.content;
    if (!message) {
        throw new Error('The AI service returned an empty response');
    }

    let parsed;
    try {
        parsed = JSON.parse(message);
    } catch (error) {
        throw new Error('Failed to parse the AI response');
    }

    const sanitize = (value) => (typeof value === 'string' ? value.trim() : '');
    const hashtags = normalizeList(parsed.hashtags).map((tag) => tag.replace(/^#+/, '').trim()).filter(Boolean);

    let finalCaption = sanitize(parsed.caption) || trimmedDescription;
    const priceString = buildPriceString(price, discount, colorPrices);
    if (priceString) {
        finalCaption += `\n\n${priceString}`;
    }

    return {
        headline: sanitize(parsed.headline) || trimmedTitle,
        caption: finalCaption,
        callToAction: sanitize(parsed.callToAction),
        hashtags,
    };
};

export default generateProductSocialCopy;