import productModel from '../models/productModel.js';
import { createEffectivePriceExpression, computeEffectivePrice } from '../utils/effectivePrice.js';

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 60;
const DEFAULT_CACHE_SIZE = parseInt(process.env.PRODUCT_SEARCH_CACHE_SIZE, 10);
const DEFAULT_CACHE_TTL = parseInt(process.env.PRODUCT_SEARCH_CACHE_TTL, 10);
const CACHE_SIZE = Number.isFinite(DEFAULT_CACHE_SIZE) && DEFAULT_CACHE_SIZE > 0 ? DEFAULT_CACHE_SIZE : 200;
const CACHE_TTL = Number.isFinite(DEFAULT_CACHE_TTL) && DEFAULT_CACHE_TTL > 0 ? DEFAULT_CACHE_TTL : 60 * 1000;
const DEFAULT_SUGGESTION_LIMIT = parseInt(process.env.PRODUCT_SEARCH_SUGGESTION_LIMIT, 10);
const SUGGESTION_LIMIT = Number.isFinite(DEFAULT_SUGGESTION_LIMIT) && DEFAULT_SUGGESTION_LIMIT > 0
    ? Math.min(DEFAULT_SUGGESTION_LIMIT, 20)
    : 8;

const createTimedCache = (maxEntries, ttl) => {
    if (!Number.isFinite(maxEntries) || maxEntries <= 0 || !Number.isFinite(ttl) || ttl <= 0) {
        return {
            get: () => undefined,
            set: () => {},
            clear: () => {},
        };
    }

    const store = new Map();

    const get = (key) => {
        const entry = store.get(key);
        if (!entry) return undefined;
        if (entry.expiresAt < Date.now()) {
            store.delete(key);
            return undefined;
        }
        store.delete(key);
        store.set(key, entry);
        return entry.value;
    };

    const set = (key, value) => {
        if (store.has(key)) {
            store.delete(key);
        }
        store.set(key, {
            value,
            expiresAt: Date.now() + ttl,
        });
        if (store.size > maxEntries) {
            const oldestKey = store.keys().next().value;
            store.delete(oldestKey);
        }
    };

    const clear = () => {
        store.clear();
    };

    return { get, set, clear };
};

const searchCache = createTimedCache(CACHE_SIZE, CACHE_TTL);

const toPositiveInt = (value, defaultValue, options = {}) => {
    const { min = 1, max = Number.POSITIVE_INFINITY } = options;
    const parsed = parseInt(value, 10);
    if (!Number.isFinite(parsed)) return defaultValue;
    return Math.max(min, Math.min(parsed, max));
};

const sanitizeTerm = (value) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    return trimmed.replace(/\s+/g, ' ');
};

const sanitizeCategory = (value) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === 'all') return '';
    return trimmed;
};

const sanitizePrice = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return Number(parsed.toFixed(2));
};

const mapFacetEntries = (entries = []) => {
    if (!Array.isArray(entries)) return [];
    return entries
        .filter((entry) => entry && entry._id)
        .map((entry) => ({
            value: entry._id,
            count: Number(entry.count) || 0,
        }));
};

const computeRelevanceLabel = (normalizedScore) => {
    if (normalizedScore >= 0.66) return 'high';
    if (normalizedScore >= 0.33) return 'medium';
    return 'low';
};

const normalizeResults = (docs, { sanitizedTerm }) => {
    if (!Array.isArray(docs) || docs.length === 0) return [];

    const mapped = docs.map((doc) => {
        const idValue = doc._id?.toString?.() || doc._id;
        const sellerIdValue = doc.sellerId?.toString?.() || doc.sellerId;
        const colors = Array.isArray(doc.colors) ? doc.colors : [];
        const colorPrices = Array.isArray(doc.colorPrices) ? doc.colorPrices : [];
        const images = Array.isArray(doc.images) ? doc.images : [];
        const rawScore = Number(doc.score);

        const product = {
            ...doc,
            _id: idValue,
            id: idValue,
            productId: idValue,
            sellerId: sellerIdValue,
            images,
            colors,
            colorPrices,
            coverImage: images[0] || null,
        };

        product.price = computeEffectivePrice(product);

        delete product.score;

        if (!sanitizedTerm || !Number.isFinite(rawScore)) {
            return product;
        }

        product.relevance = {
            raw: rawScore,
        };

        return product;
    });

    if (!sanitizedTerm) {
        return mapped;
    }

    const scores = mapped
        .map((item) => item.relevance?.raw)
        .filter((value) => Number.isFinite(value));

    if (scores.length === 0) {
        return mapped;
    }

    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const range = max - min || 1;

    mapped.forEach((item) => {
        if (!item.relevance || !Number.isFinite(item.relevance.raw)) return;
        const normalized = (item.relevance.raw - min) / range;
        item.relevance.normalized = Number(normalized.toFixed(3));
        item.relevance.score = Math.round(normalized * 100);
        item.relevance.label = computeRelevanceLabel(normalized);
    });

    return mapped;
};

const mapSuggestions = (entries = []) => {
    if (!Array.isArray(entries) || entries.length === 0) return [];

    const seen = new Set();
    const suggestions = [];

    entries.forEach((entry) => {
        if (!entry) return;
        const text = typeof entry.text === 'string' ? entry.text.trim() : '';
        if (!text) return;
        const key = text.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);

        const rawScore = Number(entry.score);

        const suggestion = {
            text,
            productId: entry.productId?.toString?.() || entry.productId || null,
            slug: entry.slug || null,
            brand: entry.brand || null,
            category: entry.category || null,
        };

        if (Number.isFinite(rawScore)) {
            suggestion.relevance = {
                raw: rawScore,
            };
        }

        suggestions.push(suggestion);
    });

    const scores = suggestions
        .map((suggestion) => suggestion.relevance?.raw)
        .filter((value) => Number.isFinite(value));

    if (scores.length === 0) {
        return suggestions;
    }

    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const range = max - min || 1;

    suggestions.forEach((suggestion) => {
        if (!suggestion.relevance || !Number.isFinite(suggestion.relevance.raw)) return;
        const normalized = (suggestion.relevance.raw - min) / range;
        suggestion.relevance.normalized = Number(normalized.toFixed(3));
        suggestion.relevance.score = Math.round(normalized * 100);
        suggestion.relevance.label = computeRelevanceLabel(normalized);
    });

    return suggestions;
};

const cloneProduct = (product) => ({
    ...product,
    images: Array.isArray(product.images) ? [...product.images] : [],
    colors: Array.isArray(product.colors) ? [...product.colors] : [],
    colorPrices: Array.isArray(product.colorPrices) ? [...product.colorPrices] : [],
    relevance: product.relevance ? { ...product.relevance } : undefined,
});

const cloneSuggestion = (suggestion) => ({
    ...suggestion,
    relevance: suggestion.relevance ? { ...suggestion.relevance } : undefined,
});

const cloneFacets = (facets) => {
    if (!facets) return undefined;
    const categories = Array.isArray(facets.categories)
        ? facets.categories.map((entry) => ({ ...entry }))
        : [];
    const brands = Array.isArray(facets.brands)
        ? facets.brands.map((entry) => ({ ...entry }))
        : [];
    return { categories, brands };
};

const cloneSearchPayload = (payload) => ({
    ...payload,
    results: Array.isArray(payload.results)
        ? payload.results.map((product) => cloneProduct(product))
        : [],
    suggestions: Array.isArray(payload.suggestions)
        ? payload.suggestions.map((suggestion) => cloneSuggestion(suggestion))
        : [],
    facets: cloneFacets(payload.facets),
    metrics: payload.metrics ? { ...payload.metrics } : undefined,
    filters: payload.filters ? { ...payload.filters } : undefined,
});

export const clearProductSearchCache = () => {
    searchCache.clear();
};

const sanitizeSort = (value) => {
    const key = typeof value === 'string' ? value.trim().toLowerCase() : '';
    switch (key) {
        case 'reviews':
        case 'review':
        case 'mostreviewed':
        case 'most-reviewed':
            return { key: 'reviews', stage: { reviewCount: -1, averageRating: -1, createdAt: -1 } };
        case 'price-asc':
        case 'price_asc':
            return { key: 'price-asc', stage: { effectivePrice: 1, createdAt: -1 } };
        case 'price-desc':
        case 'price_desc':
            return { key: 'price-desc', stage: { effectivePrice: -1, createdAt: -1 } };
        default:
            return { key: 'newest', stage: { createdAt: -1 } };
    }
};

export const searchCatalogProducts = async ({
    term = '',
    category,
    page,
    limit,
    includeFacets = true,
    includeSuggestions = false,
    minPrice,
    maxPrice,
    sort,
} = {}) => {
    const sanitizedTerm = sanitizeTerm(term);
    const sanitizedCategory = sanitizeCategory(category);
    const normalizedPage = toPositiveInt(page, 1, { min: 1 });
    const normalizedLimit = toPositiveInt(limit, DEFAULT_PAGE_SIZE, { min: 1, max: MAX_PAGE_SIZE });
    const skip = normalizedLimit * (normalizedPage - 1);

    let sanitizedMinPrice = sanitizePrice(minPrice);
    let sanitizedMaxPrice = sanitizePrice(maxPrice);

    if (sanitizedMinPrice != null && sanitizedMaxPrice != null && sanitizedMaxPrice < sanitizedMinPrice) {
        const temp = sanitizedMinPrice;
        sanitizedMinPrice = sanitizedMaxPrice;
        sanitizedMaxPrice = temp;
    }

    const { key: sortKey, stage: sortStage } = sanitizeSort(sort);

    const shouldCache = Boolean(sanitizedTerm);
    const cacheKey = shouldCache
        ? JSON.stringify({
            term: sanitizedTerm,
            category: sanitizedCategory || null,
            page: normalizedPage,
            limit: normalizedLimit,
            includeFacets,
            includeSuggestions,
            minPrice: sanitizedMinPrice,
            maxPrice: sanitizedMaxPrice,
            sort: sortKey,
        })
        : null;

    if (cacheKey) {
        const cached = searchCache.get(cacheKey);
        if (cached) {
            const cloned = cloneSearchPayload(cached);
            cloned.metrics = {
                ...(cloned.metrics || {}),
                servedFromCache: true,
                cacheKeyHit: true,
            };
            return cloned;
        }
    }

    const initialMatchStage = { isHidden: false };

    if (sanitizedCategory) {
        initialMatchStage.category = sanitizedCategory;
    }

    const pipeline = [];

    if (sanitizedTerm) {
        pipeline.push({ $match: { ...initialMatchStage, $text: { $search: sanitizedTerm } } });
    } else {
        pipeline.push({ $match: initialMatchStage });
    }

    pipeline.push({ $addFields: { effectivePrice: createEffectivePriceExpression() } });

    if (sanitizedMinPrice != null || sanitizedMaxPrice != null) {
        const priceMatch = {};
        if (sanitizedMinPrice != null) {
            priceMatch.$gte = sanitizedMinPrice;
        }
        if (sanitizedMaxPrice != null) {
            priceMatch.$lte = sanitizedMaxPrice;
        }
        pipeline.push({ $match: { effectivePrice: priceMatch } });
    }

    if (sanitizedTerm) {
        pipeline.push({ $addFields: { score: { $meta: 'textScore' } } });
        pipeline.push({ $sort: { score: -1, createdAt: -1 } });
    } else {
        pipeline.push({ $sort: sortStage });
    }

    const projectStage = {
        _id: 1,
        name: 1,
        brand: 1,
        category: 1,
        price: '$effectivePrice',
        discount: 1,
        images: { $slice: ['$images', 5] },
        slug: 1,
        shopName: 1,
        sellerId: 1,
        stock: 1,
        colors: 1,
        colorPrices: 1,
        link: 1,
        averageRating: 1,
        reviewCount: 1,
        createdAt: 1,
        updatedAt: 1,
    };

    if (sanitizedTerm) {
        projectStage.score = '$score';
    }

    const facetStage = {
        results: [
            { $skip: skip },
            { $limit: normalizedLimit },
            { $project: projectStage },
        ],
        totalCount: [
            { $count: 'value' },
        ],
    };

    if (includeFacets) {
        facetStage.categoryFacets = [
            { $group: { _id: '$category', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
        ];

        facetStage.brandFacets = [
            { $group: { _id: '$brand', count: { $sum: 1 } } },
            { $sort: { count: -1, _id: 1 } },
        ];
    }

    if (includeSuggestions && sanitizedTerm) {
        facetStage.suggestions = [
            { $limit: SUGGESTION_LIMIT },
            {
                $project: {
                    _id: 0,
                    productId: '$_id',
                    text: '$name',
                    slug: '$slug',
                    brand: '$brand',
                    category: '$category',
                    score: '$score',
                },
            },
        ];
    }

    pipeline.push({ $facet: facetStage });

    const start = Date.now();
    const [aggregationResult = {}] = await productModel.aggregate(pipeline);
    const elapsed = Date.now() - start;

    const aggregatedResults = Array.isArray(aggregationResult.results) ? aggregationResult.results : [];
    const results = normalizeResults(aggregatedResults, { sanitizedTerm });
    const total = Number(aggregationResult.totalCount?.[0]?.value) || 0;
    const totalPages = Math.max(1, Math.ceil(total / normalizedLimit));

    const response = {
        searchTerm: sanitizedTerm,
        filters: {
            category: sanitizedCategory || null,
            price: {
                min: sanitizedMinPrice,
                max: sanitizedMaxPrice,
            },
        },
        results,
        total,
        page: normalizedPage,
        perPage: normalizedLimit,
        totalPages,
        hasNextPage: normalizedPage < totalPages,
        hasPreviousPage: normalizedPage > 1,
        metrics: {
            queryTimeMs: elapsed,
            servedFromCache: false,
            cacheKeyHit: Boolean(cacheKey),
        },
    };

    if (includeFacets) {
        response.facets = {
            categories: mapFacetEntries(aggregationResult.categoryFacets),
            brands: mapFacetEntries(aggregationResult.brandFacets),
        };
    }

    if (includeSuggestions && sanitizedTerm) {
        response.suggestions = mapSuggestions(aggregationResult.suggestions);
    } else {
        response.suggestions = [];
    }

    if (cacheKey) {
        searchCache.set(cacheKey, cloneSearchPayload(response));
    }

    return response;
};
