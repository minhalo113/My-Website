export const computeEffectivePrice = (product) => {
    if (!product) return 0;

    const variantPrices = Array.isArray(product.colorPrices)
        ? product.colorPrices
            .map((value) => {
                const numeric = Number(value);
                return Number.isFinite(numeric) && numeric >= 0 ? numeric : null;
            })
            .filter((value) => value !== null)
        : [];

    let basePrice = 0;

    if (variantPrices.length > 0) {
        basePrice = Math.min(...variantPrices);
    } else {
        const priceValue = Number(product.price);
        if (Number.isFinite(priceValue) && priceValue >= 0) {
            basePrice = priceValue;
        }
    }

    const discount = Number(product.discount) || 0;
    const finalPrice = basePrice * (1 - Math.max(0, Math.min(100, discount)) / 100);

    return Math.round(finalPrice * 100) / 100;
};
