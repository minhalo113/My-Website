import React from "react";
import Link from "next/link";
import Image from "next/image";
import Rating from "../../components/Rating";
import PropTypes from "prop-types";
import { useCart } from "../../context/CartContext";
import { toast } from "react-hot-toast";
import api from "../../src/api/api";
import DiscountBadge from "../../components/DiscountBadge";
import { ensureHttps } from "../../src/utils/imageUtils";
import { US, CA } from "country-flag-icons/react/3x2";

const ProductCards = ({ GridList, products }) => {
  const { add } = useCart();

  const handleSubmit = (e, _product) => {
    e.preventDefault();

    const {
      _id,
      images,
      name,
      price,
      discount,
      colors = [],
      sizes = [],
      colorPrices = [],
      colorImages = [],
      productType,
      affiliateLink,
      shippingDestination = "both",
    } = _product;

    if (productType === "affiliate" && affiliateLink) {
      window.open(affiliateLink, "_blank", "noopener,noreferrer");
      return;
    }

    const defaultColorIndex = 0;
    const defaultColor = colors[defaultColorIndex] || "";
    const defaultSize = sizes[0] || "";
    const variantPrice =
      colorPrices[defaultColorIndex] !== undefined
        ? colorPrices[defaultColorIndex]
        : price;
    const variantImage =
      colorImages.length > 0 && defaultColor
        ? colorImages[defaultColorIndex]
        : images;

    const product = {
      id: _id,
      cartId: `${_id}-${defaultColorIndex}-${defaultSize}`,
      img: variantImage,
      name,
      price: variantPrice,
      discount,
      color: defaultColor,
      colorIndex: defaultColorIndex,
      size: defaultSize,
      shippingDestination,
    };

    add(product, 1);

    toast.success(`${1} × ${name} added to cart`, { duration: 2500 });
  };

  const addWishlist = async (e, _product) => {
    e.preventDefault();
    const { _id, colors = [], sizes = [] } = _product;
    const defaultColorIndex = 0;
    const defaultColor = colors[defaultColorIndex] || "";
    const defaultSize = sizes[0] || "";

    try {
      const res = await api.post(
        "/add-to-wishlist",
        {
          productId: _id,
          color: defaultColor,
          colorIndex: defaultColorIndex,
          size: defaultSize,
        },
        { withCredentials: true }
      );
      toast.success(res.data?.message);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding to wishlist");
    }
  };

  return (
    <div
      className={`shop-product-wrap row justify-content-center ${GridList ? "grid" : "list"
        }`}
    >
      {products.map((product) => {
        const hasVariant =
          product.colors &&
          product.colors.length > 0 &&
          Array.isArray(product.colorPrices) &&
          product.colorPrices.length > 0;

        let variantRange = null;
        if (hasVariant) {
          const prices = product.colors
            .map((_, idx) => product.colorPrices[idx])
            .filter((v) => v !== undefined);

          const min = Math.min(...prices);
          const max = Math.max(...prices);

          variantRange = {
            minBase: min.toFixed(2),
            maxBase: max.toFixed(2),
            minDiscount: (min - (min * product.discount) / 100).toFixed(2),
            maxDiscount: (max - (max * product.discount) / 100).toFixed(2),
          };
        }

        const discountedPrice =
          !hasVariant && product.discount > 0
            ? (product.price - (product.price * product.discount) / 100).toFixed(
              2
            )
            : null;

        let shippingFlag = (
          <div className="flex items-center gap-1">
            <US className="w-4 h-auto" />
            <CA className="w-4 h-auto" />
          </div>
        ); // both

        let currencyLabel = "USD";

        if (product.shippingDestination === "canada_only") {
          shippingFlag = (
            <div className="flex items-center gap-1">
              <CA className="w-4 h-auto" />
              <span>Only</span>
            </div>
          );
          currencyLabel = "CAD";
        } else if (product.shippingDestination === "us_only") {
          shippingFlag = (
            <div className="flex items-center gap-1">
              <US className="w-4 h-auto" />
              <span>Only</span>
            </div>
          );
          currencyLabel = "USD";
        }

        const imageSrc = ensureHttps(
          Array.isArray(product.images) ? product.images[0] : product.images
        );

        const renderPrice = () => {
          if (hasVariant) {
            if (product.discount > 0 && variantRange) {
              return (
                <>
                  ${variantRange.minDiscount}
                  <del className="text-sm text-gray-500 ml-1">
                    ${variantRange.minBase}
                  </del>
                  {" - "}
                  ${variantRange.maxDiscount}
                  <del className="text-sm text-gray-500 ml-1">
                    ${variantRange.maxBase}
                  </del>
                </>
              );
            }
            if (variantRange.minBase === variantRange.maxBase) {
              return <>${variantRange.minBase}</>;
            }
            return (
              <>
                ${variantRange.minBase} - ${variantRange.maxBase}
              </>
            );
          }

          if (product.discount > 0 && discountedPrice) {
            return (
              <>
                ${discountedPrice}
                <del className="text-sm text-gray-500 ml-1">
                  ${product.price}
                </del>
              </>
            );
          }

          return <>${product.price}</>;
        };

        return (
          <div key={product._id?.toString() || product.id} className="col-lg-4 col-md-6 col-12">
            <div className="product-item">
              {/* GRID STYLE */}
              <div className="product-thumb">
                <div
                  className="pro-thumb relative"
                  style={{ width: "100%", aspectRatio: "1 / 1" }}
                >
                  <Image
                    src={imageSrc}
                    alt={product.name || ""}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: "cover" }}
                  />
                  <DiscountBadge discount={product.discount} />

                  {product.productType !== "affiliate" && (
                    <span className="absolute bottom-2 left-2 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10 opacity-90">
                      {shippingFlag}
                    </span>
                  )}

                  {product.productType === "affiliate" ? (
                    <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10">
                      Check Deal ↗
                    </span>
                  ) : (
                    <span className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10">
                      Direct Sale
                    </span>
                  )}
                </div>

                <div className="product-action-link flex items-center gap-3">
                  <Link href={`/shop/${product._id?.toString()}`}>
                    <i className="icofont-eye text-xl text-slate-700 transition-transform duration-200 hover:scale-125 hover:text-indigo-400" />
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => addWishlist(e, product)}
                    className="bg-transparent border-none p-0 m-0"
                  >
                    <i className="icofont-heart text-xl text-slate-700 transition-transform duration-200 hover:scale-125 hover:text-pink-400" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleSubmit(e, product)}
                    className="bg-transparent border-none p-0 m-0"
                  >
                    <i
                      className={`text-xl text-slate-700 transition-transform duration-200 hover:scale-125 ${product.productType === "affiliate"
                        ? "icofont-external-link hover:text-blue-400"
                        : "icofont-cart-alt hover:text-emerald-400"
                        }`}
                    />
                  </button>
                </div>
              </div>

              {/* GRID CONTENT */}
              <div className="product-content">
                <h5>
                  <Link href={`/shop/${product._id?.toString()}`}>
                    {product.name}
                  </Link>
                </h5>

                <p className="productRating flex justify-center">
                  <Rating
                    rating={product.averageRating}
                    number_of_ratings={product.reviewCount}
                  />
                </p>

                <h6>
                  {renderPrice()}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    {currencyLabel}
                  </span>
                </h6>
              </div>

              {/* LIST STYLE */}
              <div className="product-list-item">
                <div className="product-thumb">
                  <div
                    className="pro-thumb relative"
                    style={{ width: "100%", aspectRatio: "1 / 1" }}
                  >
                    <Image
                      src={imageSrc}
                      alt={product.name || ""}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      style={{ objectFit: "cover" }}
                    />
                    <DiscountBadge discount={product.discount} />

                    {product.productType !== "affiliate" && (
                      <span className="absolute bottom-2 left-2 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10 opacity-90">
                        {shippingFlag}
                      </span>
                    )}

                    {product.productType === "affiliate" ? (
                      <span className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10">
                        Check Deal ↗
                      </span>
                    ) : (
                      <span className="absolute top-2 right-2 bg-emerald-600 text-white text-xs font-bold px-2 py-1 rounded shadow-md z-10">
                        Direct Sale
                      </span>
                    )}
                  </div>

                  <div className="product-action-link flex items-center gap-3">
                    <Link href={`/shop/${product._id?.toString()}`}>
                      <i className="icofont-eye text-xl text-slate-700 transition-transform duration-200 hover:scale-125 hover:text-indigo-400" />
                    </Link>

                    <button
                      type="button"
                      onClick={(e) => addWishlist(e, product)}
                      className="bg-transparent border-none p-0 m-0"
                    >
                      <i className="icofont-heart text-xl text-slate-700 transition-transform duration-200 hover:scale-125 hover:text-pink-400" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleSubmit(e, product)}
                      className="bg-transparent border-none p-0 m-0"
                    >
                      <i
                        className={`text-xl text-slate-700 transition-transform duration-200 hover:scale-125 ${product.productType === "affiliate"
                          ? "icofont-external-link hover:text-blue-400"
                          : "icofont-cart-alt hover:text-emerald-400"
                          }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="product-content">
                  <h5>
                    <Link href={`/shop/${product._id?.toString()}`}>
                      {product.name}
                    </Link>
                  </h5>

                  <p className="productRating">
                    <Rating
                      rating={product.averageRating}
                      number_of_ratings={product.reviewCount}
                    />
                  </p>

                  <h6>
                    {renderPrice()}
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      {currencyLabel}
                    </span>
                  </h6>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

ProductCards.propTypes = {
  GridList: PropTypes.bool.isRequired,
  products: PropTypes.array.isRequired,
};

ProductCards.defaultProps = {
  GridList: true,
  products: [],
};

export default ProductCards;
