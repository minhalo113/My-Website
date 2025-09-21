import productModel from "../models/productModel.js";
import { fingerprintSimilarity, hammingDistance } from "./imageFingerprint.js";

export const SEARCHABLE_PRODUCTS_QUERY = {
    $or: [
        { imageFingerprints: { $exists: true, $ne: [] } },
        { colorImageFingerprints: { $exists: true, $ne: [] } },
    ],
};

export const SEARCHABLE_PRODUCTS_FIELDS =
    "name brand category images imageFingerprints colorImages colorImageFingerprints colors shopName sellerId slug price discount stock link";

export const fetchProductsForImageSearch = async () => {
    return await productModel
        .find(SEARCHABLE_PRODUCTS_QUERY)
        .select(SEARCHABLE_PRODUCTS_FIELDS)
        .lean();
};

const formatMatchSummary = (match) => ({
    imageUrl: match.imageUrl,
    matchType: match.matchType,
    distance: match.distance,
    similarity: match.similarity,
    fingerprint: match.fingerprint,
    colorLabel: match.colorLabel || null,
    index: match.index,
});

export const collectMatchesForFingerprint = ({ products = [], queryFingerprint, threshold }) => {
    if (!queryFingerprint) {
        return { groupedMatches: [], rawMatches: [] };
    }

    const rawMatches = [];

    const pushMatch = ({ product, imageUrl, distance, matchType, fingerprint, colorLabel, index }) => {
        if (!Number.isFinite(distance) || distance > threshold) return;
        rawMatches.push({
            productId: product._id.toString(),
            productName: product.name,
            brand: product.brand,
            category: product.category,
            imageUrl,
            matchType,
            distance,
            similarity: fingerprintSimilarity(distance),
            fingerprint,
            colorLabel: colorLabel || null,
            index,
            shopName: product.shopName,
            sellerId: product.sellerId?.toString?.() || product.sellerId,
            slug: product.slug,
            price: product.price,
            discount: product.discount,
            stock: product.stock,
            link: product.link,
        });
    };

    for (const product of products) {
        const images = Array.isArray(product.images) ? product.images : [];
        const imageFingerprints = Array.isArray(product.imageFingerprints) ? product.imageFingerprints : [];
        const colorImages = Array.isArray(product.colorImages) ? product.colorImages : [];
        const colorFingerprints = Array.isArray(product.colorImageFingerprints) ? product.colorImageFingerprints : [];
        const colorLabels = Array.isArray(product.colors) ? product.colors : [];

        images.forEach((imgUrl, idx) => {
            const fingerprint = imageFingerprints[idx];
            if (!fingerprint || !imgUrl) return;
            const distance = hammingDistance(queryFingerprint, fingerprint);
            pushMatch({
                product,
                imageUrl: imgUrl,
                distance,
                matchType: "primary",
                fingerprint,
                index: idx,
            });
        });

        colorImages.forEach((imgUrl, idx) => {
            const fingerprint = colorFingerprints[idx];
            if (!fingerprint || !imgUrl) return;
            const distance = hammingDistance(queryFingerprint, fingerprint);
            pushMatch({
                product,
                imageUrl: imgUrl,
                distance,
                matchType: "color",
                fingerprint,
                colorLabel: colorLabels[idx],
                index: idx,
            });
        });
    }

    rawMatches.sort((a, b) => a.distance - b.distance);

    const groupedMap = new Map();

    for (const match of rawMatches) {
        const existing = groupedMap.get(match.productId);
        if (!existing) {
            groupedMap.set(match.productId, {
                productId: match.productId,
                productName: match.productName,
                brand: match.brand,
                category: match.category,
                shopName: match.shopName,
                sellerId: match.sellerId,
                slug: match.slug,
                price: match.price,
                discount: match.discount,
                stock: match.stock,
                link: match.link,
                matches: [formatMatchSummary(match)],
                primaryMatches: match.matchType === "primary" ? [formatMatchSummary(match)] : [],
                variantMatches: match.matchType === "color" ? [formatMatchSummary(match)] : [],
                similarOptions: match.colorLabel ? new Set([match.colorLabel]) : new Set(),
                bestMatch: formatMatchSummary(match),
            });
        } else {
            const formatted = formatMatchSummary(match);
            existing.matches.push(formatted);
            if (match.matchType === "primary") {
                existing.primaryMatches.push(formatted);
            } else {
                existing.variantMatches.push(formatted);
            }
            if (match.colorLabel) {
                existing.similarOptions.add(match.colorLabel);
            }
            if (!existing.bestMatch || formatted.distance < existing.bestMatch.distance) {
                existing.bestMatch = formatted;
            }
        }
    }

    const groupedMatches = Array.from(groupedMap.values()).map((entry) => ({
        productId: entry.productId,
        productName: entry.productName,
        brand: entry.brand,
        category: entry.category,
        shopName: entry.shopName,
        sellerId: entry.sellerId,
        slug: entry.slug,
        price: entry.price,
        discount: entry.discount,
        stock: entry.stock,
        link: entry.link,
        imageUrl: entry.bestMatch?.imageUrl || null,
        matchType: entry.bestMatch?.matchType || null,
        distance: entry.bestMatch?.distance ?? null,
        similarity: entry.bestMatch?.similarity ?? null,
        colorLabel: entry.bestMatch?.colorLabel || null,
        index: entry.bestMatch?.index ?? null,
        matches: entry.matches,
        bestMatch: entry.bestMatch,
        primaryMatches: entry.primaryMatches,
        variantMatches: entry.variantMatches,
        similarOptions: Array.from(entry.similarOptions),
    }));

    groupedMatches.sort((a, b) => {
        const aDistance = a.bestMatch?.distance ?? Number.POSITIVE_INFINITY;
        const bDistance = b.bestMatch?.distance ?? Number.POSITIVE_INFINITY;
        return aDistance - bDistance;
    });

    return { groupedMatches, rawMatches };
};