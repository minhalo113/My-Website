import { useEffect, useState } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { messageClear, update_blog, get_blog } from '../../store/Reducers/blogReducer';
import { get_products } from '../../store/Reducers/productReducer';
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { FaTrash, FaPlus, FaSearch } from "react-icons/fa";
import { US, CA } from 'country-flag-icons/react/3x2';

const BlogEdit = () => {
  const dispatch = useDispatch();
  const { id } = useParams();

  const { blog, successMessage, errorMessage } = useSelector(state => state.blog);
  const { products: searchProducts, totalProduct } = useSelector(state => state.product);

  const [formData, setFormData] = useState({
    image: '',
    title: '',
    content: '',
    description: '',
    blockQuote: '',
    youtubeLink: '',
    youtubeThumbnail: '',
    citation: '',
    tags: '',
    status: 'approved',
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [previewYoutubeThumbnail, setPreviewYoutubeThumbnail] = useState(null);
  const [attachedProducts, setAttachedProducts] = useState([]);

  // Product Search State
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (successMessage) {
      toast.success(successMessage);
      dispatch(messageClear());
    }
    if (errorMessage) {
      toast.error(errorMessage);
      dispatch(messageClear());
    }
    if (id) {
      dispatch(get_blog(id))
    }
  }, [successMessage, errorMessage, dispatch, id])

  useEffect(() => {
    if (blog && blog.title) {
      setFormData({
        image: blog.image,
        title: blog.title,
        content: blog.content,
        description: blog.desc,
        blockQuote: blog.blockquote,
        youtubeLink: blog.youtubeLink,
        youtubeThumbnail: blog.youtubeThumbnail,
        citation: blog.citation,
        tags: blog.tags,
        status: blog.status || 'approved',
      });

      // Initialize attached products from blog data
      if (blog.products && Array.isArray(blog.products)) {
        setAttachedProducts(blog.products);
      }
    }
  }, [blog]);


  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'image' || name === 'youtubeThumbnail') {
      const file = files[0];
      if (file) {
        const previewUrl = URL.createObjectURL(file);
        if (name === 'image') setPreviewImage(previewUrl);
        if (name === 'youtubeThumbnail') setPreviewYoutubeThumbnail(previewUrl);
      }
      setFormData({ ...formData, [name]: file });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleProductSearch = (e) => {
    e.preventDefault();
    if (!productSearchTerm.trim()) return;

    setIsSearching(true);
    dispatch(get_products({
      parPage: 10,
      page: 1,
      searchValue: productSearchTerm
    }));
  };

  const addProduct = (product) => {
    if (attachedProducts.find(p => p._id === product._id)) {
      toast.error("Product already added");
      return;
    }
    if (attachedProducts.length >= 5) {
      toast.error("Maximum 5 products allowed");
      return;
    }
    setAttachedProducts([...attachedProducts, product]);
    toast.success("Product added");
  };

  const removeProduct = (productId) => {
    setAttachedProducts(attachedProducts.filter(p => p._id !== productId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const data = new FormData();
    for (let key in formData) {
      data.append(key, formData[key]);
    }

    data.append("id", id);

    // Append product IDs as JSON string
    const productIds = attachedProducts.map(p => p._id);
    data.append("products", JSON.stringify(productIds));

    dispatch(update_blog(data));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Edit Blog Post</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium">Blog Image</label>
              <input type="file" name="image" accept="image/*" onChange={handleChange} className="mt-1" />
              {(previewImage || blog?.image?.url) && (
                <img
                  src={previewImage || blog.image.url}
                  alt="Blog Preview"
                  className="mt-2 w-full h-auto rounded object-cover max-h-60"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border rounded" />
            </div>

            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea name="description" value={formData.description} onChange={handleChange} className="w-full p-2 border rounded"></textarea>
            </div>
          </div>

          <div className="space-y-4">
            {/* Product Management Section */}
            <div className="border p-4 rounded bg-gray-50">
              <h3 className="font-semibold mb-2">Related Products (Max 5)</h3>

              {/* Attached Products List */}
              <div className="space-y-2 mb-4">
                {attachedProducts.length === 0 && <p className="text-sm text-gray-500">No products linked.</p>}
                {attachedProducts.map(product => {
                  const hasVariant = product.colors && product.colors.length > 0 && Array.isArray(product.colorPrices) && product.colorPrices.length > 0;
                  let variantRange = null;
                  if (hasVariant) {
                    const prices = product.colors.map((c, idx) => product.colorPrices[idx]).filter(v => v !== undefined);
                    const min = Math.min(...prices);
                    const max = Math.max(...prices);
                    variantRange = {
                      minBase: min.toFixed(2),
                      maxBase: max.toFixed(2),
                      minDiscount: (min - (min * (product.discount || 0)) / 100).toFixed(2),
                      maxDiscount: (max - (max * (product.discount || 0)) / 100).toFixed(2)
                    };
                  }
                  const discountedPrice = (!hasVariant && (product.discount || 0) > 0) ? (product.price - (product.price * product.discount) / 100).toFixed(2) : null;

                  let shippingFlag = (
                    <div className="flex items-center gap-1">
                      <US className="w-4 h-auto" />
                      <CA className="w-4 h-auto" />
                    </div>
                  );
                  let currencyLabel = 'USD';
                  if (product.shippingDestination === 'canada_only') {
                    shippingFlag = (
                      <div className="flex items-center gap-1">
                        <CA className="w-4 h-auto" />
                      </div>
                    );
                    currencyLabel = 'CAD';
                  } else if (product.shippingDestination === 'us_only') {
                    shippingFlag = (
                      <div className="flex items-center gap-1">
                        <US className="w-4 h-auto" />
                      </div>
                    );
                    currencyLabel = 'USD';
                  }

                  return (
                    <div key={product._id} className="flex items-center justify-between bg-white p-2 rounded border">
                      <div className="flex items-center gap-2">
                        <div className="relative w-10 h-10">
                          <img
                            src={product.images?.[0] || '/images/placeholder.png'}
                            alt={product.name}
                            className="w-full h-full object-cover rounded"
                          />
                          {product.productType !== 'affiliate' && (
                            <span className="absolute bottom-0 right-0 bg-slate-800 text-white text-[8px] font-bold px-1 rounded shadow-md z-10 opacity-90 flex items-center justify-center">
                              {shippingFlag}
                            </span>
                          )}
                        </div>
                        <div className="text-sm">
                          <p className="font-medium truncate max-w-[150px]">{product.name}</p>
                          <div className="text-xs text-gray-500">
                            {hasVariant ? (
                              (product.discount || 0) > 0 ? (
                                <>
                                  ${variantRange.minDiscount} - ${variantRange.maxDiscount}
                                </>
                              ) : (
                                variantRange.minBase === variantRange.maxBase ? `$${variantRange.minBase}` : `$${variantRange.minBase} - $${variantRange.maxBase}`
                              )
                            ) : (product.discount || 0) > 0 ? (
                              <>
                                ${discountedPrice} <del className="text-gray-400">${product.price}</del>
                              </>
                            ) : (
                              `$${product.price}`
                            )}
                            <span className="text-[10px] ml-1">{currencyLabel}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeProduct(product._id)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Search to Add */}
              <div className="mt-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className="flex-1 p-2 text-sm border rounded"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleProductSearch}
                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                  >
                    <FaSearch />
                  </button>
                </div>

                {/* Search Results */}
                {isSearching && searchProducts && searchProducts.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded bg-white">
                    {searchProducts.map(product => (
                      <div key={product._id} className="flex justify-between items-center p-2 hover:bg-gray-50 border-b last:border-0">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <img
                            src={product.images?.[0]}
                            alt=""
                            className="w-8 h-8 rounded object-cover"
                          />
                          <span className="text-xs truncate max-w-[120px]">{product.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => addProduct(product)}
                          className="text-green-600 hover:text-green-800 text-xs font-bold px-2"
                        >
                          ADD
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Content</label>
          <textarea name="content" value={formData.content} onChange={handleChange} rows={8} className="w-full p-2 border rounded"></textarea>
        </div>

        <div>
          <label className="block text-sm font-medium">Block Quote</label>
          <input type="text" name="blockQuote" value={formData.blockQuote} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">YouTube Link</label>
            <input type="text" name="youtubeLink" value={formData.youtubeLink} onChange={handleChange} className="w-full p-2 border rounded" />
          </div>

          <div>
            <label className="block text-sm font-medium">YouTube Thumbnail</label>
            <input type="file" name="youtubeThumbnail" accept="image/*" onChange={handleChange} className="mt-1" />
            {(previewYoutubeThumbnail || blog?.youtubeThumbnail?.url) && (
              <img
                src={previewYoutubeThumbnail || blog.youtubeThumbnail.url}
                alt="YouTube Thumbnail Preview"
                className="mt-2 w-full max-w-[200px] h-auto rounded"
              />
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Citation</label>
          <input type="text" name="citation" value={formData.citation} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block text-sm font-medium">Tags (comma-separated)</label>
          <input type="text" name="tags" value={formData.tags} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full md:w-auto">Save Changes</button>
      </form>
    </div>
  );
};

export default BlogEdit;