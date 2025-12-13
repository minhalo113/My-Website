export default function extractSkuImagesAndPrices(data) {
  const toArray = (x) => (Array.isArray(x) ? x : x ? [x] : []);
  const result =
    data?.aliexpress_ds_product_get_response?.result ??
    data?.result ??
    data;

  const rawSkus = result?.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o ?? [];
  const skus = toArray(rawSkus).flatMap((sku) => {
    const priceStr = sku?.sku_price ?? null;  
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

  const summaryPriceLine = skus
    .map((row) => `${row.property_value_definition_name}: ${row.sku_price}`)

  const summaryImageLine = skus
    .map((row) => `${row.property_value_definition_name}: ${row.sku_image}`)

  const summaryNamesLine = skus
    .map((row) => row.property_value_definition_name)

  const summaryPricePlus15Line = skus
    .map((row) => `${row.property_value_definition_name}: ${row.sku_price != null ? row.sku_price + 15 : row.sku_price}`)

  return {
    skus,                 
    image_urls,   
    summaryPriceLine,  
    summaryImageLine,      
    summaryNamesLine,        
    summaryPricePlus15Line,  
  };
}
