import productModel from '../models/productModel.js';

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
            set: () => { },
            clear: () => { },
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

const sanitizeProductType = (value) => {
    if (typeof value !== 'string') return '';
    const trimmed = value.trim().toLowerCase();
    // Only accept internal database values, mapping happens in controller
    if (['standard', 'affiliate'].includes(trimmed)) return trimmed;
    return '';
};

const sanitizePrice = (value) => {
    if (value === undefined || value === null || value === '') return null;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) return null;
    return Number(parsed.toFixed(2));
};

const mapEntries = (entries = []) => {
    if (!Array.isArray(entries)) return [];
    return entries
        .filter((entry) => entry && entry._id)
        .map((entry) => ({
            value: entry._id,
            count: Number(entry.count) || 0,
        }));
};

// const mapBucketEntries = (buckets = []) => {
//     if (!Array.isArray(buckets)) return [];
//     return buckets.map(b => ({
//         value: b._id,
//         count: Number(b.count) || 0
//     }));
// };

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


        delete product.score;
        delete product.totalCount;

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
            return { key: 'reviews', stage: { reviewCount: -1, averageRating: -1, _id: -1 } };
        // case 'price-asc':
        case 'price_asc':
            return { key: 'price-asc', stage: { effectivePrice: 1, _id: -1 } };
        // case 'price-desc':
        case 'price_desc':
            return { key: 'price-desc', stage: { effectivePrice: -1, _id: -1 } };
        default:
            return { key: 'newest', stage: { _id: -1 } };
    }
};

export const searchCatalogProducts = async ({
    term = '',
    category,
    productType,
    page,
    limit,
    includeFacets = true,
    includeSuggestions = false,
    minPrice,
    maxPrice,
    sort,
    includeHidden = false,
} = {}) => {
    const sanitizedTerm = sanitizeTerm(term);
    const sanitizedCategory = sanitizeCategory(category);
    const sanitizedProductType = sanitizeProductType(productType);
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
            productType: sanitizedProductType || null,
            page: normalizedPage,
            limit: normalizedLimit,
            includeFacets,
            includeSuggestions,
            minPrice: sanitizedMinPrice,
            maxPrice: sanitizedMaxPrice,
            sort: sortKey,
            includeHidden,
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

    const searchCompound = {};
    if (sanitizedTerm) {
        searchCompound.should = [
            {
                autocomplete: {
                    query: sanitizedTerm,
                    path: 'name',
                    fuzzy: { maxEdits: 1, prefixLength: 1 },
                },
            },
            {
                text: {
                    query: sanitizedTerm,
                    path: 'name',
                    score: { boost: { value: 3 } },
                },
            },
            {
                text: {
                    query: sanitizedTerm,
                    path: 'description',
                },
            },
        ];
    }

    const filters = [];

    if (sanitizedCategory) {
        filters.push({
            equals: {
                value: sanitizedCategory,
                path: 'category',
            },
        });
    }

    if (!includeHidden) {
        filters.push({
            equals: {
                value: false,
                path: 'isHidden',
            },
        });
    }

    if (sanitizedProductType) {
        filters.push({
            equals: {
                value: sanitizedProductType,
                path: 'productType',
            },
        });
    }

    if (sanitizedMinPrice != null || sanitizedMaxPrice != null) {
        const range = { path: 'effectivePrice' };
        if (sanitizedMinPrice != null) range.gte = sanitizedMinPrice;
        if (sanitizedMaxPrice != null) range.lte = sanitizedMaxPrice;
        filters.push({ range });
    }

    // Assign filters to compound operator if any exist
    if (filters.length > 0) {
        searchCompound.filter = filters;
    }

    const resultsPipeline = [];

    if (sanitizedTerm) {
        resultsPipeline.push({
            $search: {
                index: 'default',
                compound: searchCompound,
            }
        });
    } else {
        const matchStage = {};
        if (sanitizedCategory) {
            matchStage.category = sanitizedCategory;
        }
        if (!includeHidden) {
            matchStage.isHidden = false;
        }
        if (sanitizedProductType) {
            matchStage.productType = sanitizedProductType;
        }
        if (sanitizedMinPrice != null || sanitizedMaxPrice != null) {
            const priceMatch = {};
            if (sanitizedMinPrice != null) priceMatch.$gte = sanitizedMinPrice;
            if (sanitizedMaxPrice != null) priceMatch.$lte = sanitizedMaxPrice;
            matchStage.effectivePrice = priceMatch;
        }
        resultsPipeline.push({ $match: matchStage });
    }


    if (sanitizedTerm) {
        resultsPipeline.push({ $addFields: { score: { $meta: 'searchScore' } } });
        if (sort) {
            resultsPipeline.push({ $sort: sortStage });
        } else {
            // resultsPipeline.push({ $sort: { score: -1, _id: 1 } });
            resultsPipeline.push({ $sort: { score: -1 } });
        }
    } else {
        resultsPipeline.push({ $sort: sortStage });
    }

    const useSplitExecution = Boolean(sanitizedTerm);

    if (!useSplitExecution) {
        resultsPipeline.push({
            $setWindowFields: {
                output: {
                    totalCount: { $count: {} }
                }
            }
        });
    }

    // 6. Pagination & Projection
    resultsPipeline.push({ $skip: skip });
    resultsPipeline.push({ $limit: normalizedLimit });
    resultsPipeline.push({
        $project: {
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
            isHidden: 1,
            productType: 1,
            score: sanitizedTerm ? '$score' : undefined,
            totalCount: 1,
            affiliateLink: 1,
            shippingDestination: 1,
            sizes: 1,
            colorImages: 1,
        }
    });

    const facetsPipeline = [];
    if (useSplitExecution) {
        if (includeFacets) {
            facetsPipeline.push({
                $searchMeta: {
                    index: "default",
                    facet: {
                        operator: {
                            compound: searchCompound
                        },
                        facets: {
                            "categories": {
                                "type": "string",
                                "path": "category"
                            },
                            "brands": {
                                "type": "string",
                                "path": "brand"
                            }
                        }
                    }
                }
            });
        } else {
            facetsPipeline.push({
                $searchMeta: {
                    index: "default",
                    count: { type: "lowerBound" },
                    compound: searchCompound
                }
            });
        }

    } else if (includeFacets) {
        // Standard non-search aggregation facets
        const matchStage = {};
        if (sanitizedCategory) matchStage.category = sanitizedCategory;
        if (!includeHidden) matchStage.isHidden = false;
        if (sanitizedProductType) matchStage.productType = sanitizedProductType;

        if (sanitizedMinPrice != null || sanitizedMaxPrice != null) {
            const priceMatch = {};
            if (sanitizedMinPrice != null) priceMatch.$gte = sanitizedMinPrice;
            if (sanitizedMaxPrice != null) priceMatch.$lte = sanitizedMaxPrice;
            matchStage.effectivePrice = priceMatch;
        }

        facetsPipeline.push({ $match: matchStage });
        facetsPipeline.push({
            $facet: {
                categories: [
                    { $group: { _id: '$category', count: { $sum: 1 } } },
                    { $sort: { count: -1, _id: 1 } }
                ],
                brands: [
                    { $group: { _id: '$brand', count: { $sum: 1 } } },
                    { $sort: { count: -1, _id: 1 } }
                ]
            }
        });
    }

    const start = Date.now();

    const promises = [productModel.aggregate(resultsPipeline).allowDiskUse(true)];

    if (useSplitExecution || (includeFacets && facetsPipeline.length > 0)) {
        promises.push(productModel.aggregate(facetsPipeline).allowDiskUse(true));
    }

    let suggestionsPromise = Promise.resolve([]);
    if (includeSuggestions && sanitizedTerm) {
        const suggestionPipeline = [
            {
                $search: {
                    index: 'default',
                    autocomplete: {
                        query: sanitizedTerm,
                        path: 'name',
                        fuzzy: { maxEdits: 1, prefixLength: 1 }
                    }
                }
            },
            { $limit: SUGGESTION_LIMIT },
            {
                $project: {
                    _id: 0,
                    productId: '$_id',
                    text: '$name',
                    slug: '$slug',
                    brand: '$brand',
                    category: '$category',
                    score: { $meta: 'searchScore' }
                }
            }
        ];
        suggestionsPromise = productModel.aggregate(suggestionPipeline);
    }

    const [resultsArr, facetsResultArr, suggestionsResultArr] = await Promise.all([
        promises[0],
        (useSplitExecution || (includeFacets && facetsPipeline.length > 0)) ? promises[1] : Promise.resolve([]),
        suggestionsPromise
    ]);

    const elapsed = Date.now() - start;

    const normalizedResults = normalizeResults(resultsArr, { sanitizedTerm });

    let finalFacets = undefined;
    let total = 0;

    if (useSplitExecution) {
        const meta = facetsResultArr[0] || {};
        total = meta.count?.lowerBound || 0;

        if (includeFacets) {
            const bucketData = meta.facet || {};
            finalFacets = {
                categories: mapEntries(bucketData.categories?.buckets),
                brands: mapEntries(bucketData.brands?.buckets)
            };
        }

    } else if (includeFacets) {
        const meta = facetsResultArr[0];
        total = resultsArr.length > 0 ? (resultsArr[0].totalCount || 0) : 0;
        finalFacets = {
            categories: mapEntries(meta?.categories),
            brands: mapEntries(meta?.brands)
        };
    } else {
        total = resultsArr.length > 0 ? (resultsArr[0].totalCount || 0) : 0;
    }

    const totalPages = Math.max(1, Math.ceil(total / normalizedLimit));

    const finalSuggestions = mapSuggestions(suggestionsResultArr || []);

    const response = {
        searchTerm: sanitizedTerm,
        filters: {
            category: sanitizedCategory || null,
            price: {
                min: sanitizedMinPrice,
                max: sanitizedMaxPrice,
            },
        },
        results: normalizedResults,
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
        response.facets = finalFacets;
    }

    if (includeSuggestions && sanitizedTerm) {
        response.suggestions = finalSuggestions;
    } else {
        response.suggestions = [];
    }

    if (cacheKey) {
        searchCache.set(cacheKey, cloneSearchPayload(response));
    }

    return response;
};
