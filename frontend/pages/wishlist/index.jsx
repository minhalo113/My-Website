import { useEffect, useState, useContext } from "react";
import PageHeader from "../../components/PageHeader";
import api from "../../src/api/api";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import { useCart } from '../../context/CartContext';

const WishList = () => {
    const {user} = useContext(AuthContext);
    const [wishlist, setWishlist] = useState([])
    const [loading, setLoading] = useState(true)
    const {add} = useCart();

    useEffect(() => {
        const fetchWishlist = async() => {
            try{
                const res = await api.get("/wishlist", {withCredentials: true});
                setWishlist(res.data.wishlist);
            }catch(error){
                toast.error("Failed to fetch wishlist");
                console.log("Failed to fetch wishlist", error);
            }finally{
                setLoading(false);
            }
        }

        if(user) {
            fetchWishlist();
        }
    }, [user, loading])

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-900 text-slate-100">
                <PageHeader title="Wishlist" curPage="Wishlist" />
                <p className="text-slate-400">Please login to view your wishlist.</p>;
            </div>
        )
      }

      const handleSubmit = (e, _product) => {
        const {productId, images, name, price, color = '', size = '', colorIndex} = _product;
        const product = {
            id: productId,
            cartId: `${productId}-${colorIndex ?? color}-${size || ''}`,
            img: images,
            name: name,
            price: price,
            color,
            colorIndex,
            size
        }
    
        e.preventDefault();
        add(product, 1)
    
        toast.success(
            `${1} × ${name} added to cart`,
            { duration: 2500 }     
        );
    }

      const removeProductFromWishlist = async(e, product) => {
        e.preventDefault();
        setLoading(true);

        try{
            const res = await api.post(
                "/remove-from-wishlist",
                {
                    productId: product.productId,
                    color: product.color,
                    size: product.size,
                    type: product.type
                },
                {withCredentials: true}
            );
            toast.success(res.data.message);
            setWishlist(w => w.filter(p => !(p.productId === product.productId && (p.color||'') === (product.color||'') && (p.size||'') === (product.size||'') && (p.type||'') === (product.type||''))));
        }catch(error){
            toast.error("Failed to remove product from wishlist");
            console.log(error)
        }finally{
            setLoading(false)
        }
      } 
    
      return (
        <div className="min-h-screen text-slate-100">
          <PageHeader title="Wishlist" curPage="Wishlist" />
      
          <div className="mx-auto w-full max-w-6xl px-4 py-10 lg:px-8">
            <h2 className="mb-6 text-2xl font-semibold">Your Wishlist</h2>
      
            {loading ? (
              <p className="text-slate-400">Loading...</p>
            ) : wishlist.length === 0 ? (
              <p className="text-slate-400">Your wishlist is empty.</p>
            ) : (
                <ul className="flex flex-col gap-6 list-none pl-0">
                {wishlist.map((product) => (
                  <li
                    key={product._id}
                    className="rounded-2xl bg-amber-500/80 p-4 shadow-md transition hover:-translate-y-0.5 hover:shadow-indigo-500/40"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-30 w-30 shrink-0 overflow-hidden rounded bg-slate-700">
                        <img
                          src={Array.isArray(product.images) ? product.images[0] : product.images}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h6 className="line-clamp-2 break-words text-sm font-semibold leading-snug text-slate-900">
                          {product.name}
                        </h6>
                          <p className="text-sm text-slate-800/80">
                            {new Intl.NumberFormat("en-CA", {
                              style: "currency",
                              currency: "CAD",
                            }).format(product.price)}
                          </p>
                          {product.color && (
                            <p className="text-xs text-slate-700">Color: {product.color}</p>
                          )}
                          {product.size && (
                            <p className="text-xs text-slate-700">Size: {product.size}</p>
                          )}
                          <div className="my-4 h-px w-full bg-slate-700" />
                        <div className="flex flex-wrap gap-3 text-xs font-medium">
                            <a
                                onClick={(e) => handleSubmit(e, product)}
                                className="text-indigo-600 hover:text-indigo-400 relative cursor-pointer transition-all duration-200 ease-in-out hover:scale-[1.05] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-indigo-400 hover:after:w-full after:transition-all after:duration-300"
                            >
                                Add to Cart
                            </a>

                            <a
                                href={`/shop/${product.productId.toString()}`}
                                className="text-indigo-600 hover:text-indigo-400 relative transition-all duration-200 ease-in-out hover:scale-[1.05] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-indigo-400 hover:after:w-full after:transition-all after:duration-300"
                            >
                                Product Details
                            </a>

                            <a
                                onClick={(e) => removeProductFromWishlist(e, product)}
                                className="text-red-500 hover:text-red-400 relative cursor-pointer transition-all duration-200 ease-in-out hover:scale-[1.05] after:absolute after:bottom-0 after:left-0 after:h-[1px] after:w-0 after:bg-red-400 hover:after:w-full after:transition-all after:duration-300"
                            >
                                Remove from Wishlist
                            </a>
                        </div>

                      </div>

                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
}

export default WishList