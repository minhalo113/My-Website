export default function extractSkuImagesAndPrices(data) {
  const toArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);
  const result =
    data?.aliexpress_ds_product_get_response?.result ??
    data?.result ??
    data;

  const rawSkus = result?.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o ?? [];

  const skus = toArray(rawSkus).flatMap((sku) => {
    const priceStr = sku?.sku_price ?? null; // keep sku_price only
    const sku_price = priceStr != null ? parseFloat(priceStr) : null;

    const props = toArray(sku?.ae_sku_property_dtos?.ae_sku_property_d_t_o);

    return props.map((p) => ({
      property_value_definition_name: p?.property_value_definition_name ?? null,
      sku_image: p?.sku_image ?? null,
      sku_price,
    }));
  });

  const imageUrlsStr = result?.ae_multimedia_info_dto?.image_urls ?? "";
  const image_urls = imageUrlsStr
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);

  const priceMap = new Map();
  const imageMap = new Map();

  for (const row of skus) {
    const name = row.property_value_definition_name;
    if (!name) continue;
    if (row.sku_price != null) priceMap.set(name, row.sku_price);
    if (row.sku_image) imageMap.set(name, row.sku_image);
  }

  const summaryPriceLine = Array.from(priceMap.entries())
    .map(([name, price]) => `${name}: ${price}`)
    .join(", ");

  const summaryImageLine = Array.from(imageMap.entries())
    .map(([name, url]) => `${name}: ${url}`)
    .join(", ");

  const summaryNamesLine = Array.from(priceMap.keys()).join(", ");

  const summaryPricePlus15Line = Array.from(priceMap.entries())
    .map(([name, price]) => `${name}: ${price + 15}`)
    .join(", ");

  return {
    skus,
    image_urls,
    summaryPriceLine,
    summaryImageLine,
    summaryNamesLine,
    summaryPricePlus15Line,
  };
}