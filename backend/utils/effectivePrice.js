export const createEffectivePriceExpression = () => ({
    $let: {
        vars: {
            variantPrices: {
                $filter: {
                    input: {
                        $map: {
                            input: { $ifNull: ['$colorPrices', []] },
                            as: 'price',
                            in: {
                                $cond: [
                                    {
                                        $in: [
                                            { $type: '$$price' },
                                            ['double', 'decimal', 'int', 'long']
                                        ],
                                    },
                                    { $toDouble: '$$price' },
                                    {
                                        $cond: [
                                            { $eq: [{ $type: '$$price' }, 'string'] },
                                            {
                                                $convert: {
                                                    input: '$$price',
                                                    to: 'double',
                                                    onError: null,
                                                    onNull: null,
                                                },
                                            },
                                            null,
                                        ],
                                    },
                                ],
                            },
                        },
                    },
                    as: 'variantPrice',
                    cond: {
                        $and: [
                            { $ne: ['$$variantPrice', null] },
                            { $gte: ['$$variantPrice', 0] },
                        ],
                    },
                },
            },
            basePrice: {
                $convert: {
                    input: '$price',
                    to: 'double',
                    onError: 0,
                    onNull: 0,
                },
            },
        },
        in: {
            $let: {
                vars: {
                    variantCount: { $size: '$$variantPrices' },
                },
                in: {
                    $cond: [
                        { $gt: ['$$variantCount', 0] },
                        { $min: '$$variantPrices' },
                        '$$basePrice',
                    ],
                },
            },
        },
    },
});

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

    if (variantPrices.length > 0) {
        const minVariant = Math.min(...variantPrices);
        return Math.round(minVariant * 100) / 100;
    }

    const priceValue = Number(product.price);
    if (Number.isFinite(priceValue) && priceValue >= 0) {
        return Math.round(priceValue * 100) / 100;
    }

    return 0;
};