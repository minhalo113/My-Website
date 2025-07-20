import PageHeader from "../../components/PageHeader"
import { ChevronDown, PackageCheck, PackageX } from "lucide-react";
import { useEffect, useState } from "react";
import { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import PropTypes from "prop-types";
import api from "../../src/api/api";

const History = () => {
    const {user} = useContext(AuthContext);
    const [orders, setOrders] = useState([])
    const [expanded, setExpanded] = useState(null);
    const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));
    
    useEffect(() => {
        const fetchData = async() => {
            try{
                const customerOrders = await api.get('/customers-orders', {withCredentials: true})
                setOrders(customerOrders.data.orders)
            }catch(err){
                console.log(err)
            }finally{
                //
            }
        }

        fetchData();
    }, [])

    if (!user){
        return(
            <div className="min-h-screen bg-slate-700 text-slate-100">
                <PageHeader title="Order History" curPage="Order History" />
                <p className="text-slate-400">Please Logiin First To Check Your Order History</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen text-slate-100">
          <PageHeader title="Order History" curPage="Order History" />
    
          <div className="mx-auto w-full max-w-6xl px-4 py-10 lg:px-8">
            <h2 className="mb-6 text-2xl font-semibold">Your recent orders</h2>
    
            {orders.length === 0 ? (
              <p className="text-slate-400">You don’t have any orders yet.</p>
            ) : (
              <div className="flex flex-col m-1 gap-2 list-none pl-0">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="rounded-2xl bg-slate-700 p-6 shadow hover:shadow-indigo-500/30 transition-shadow"
                  >
                    <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm uppercase tracking-wider text-indigo-400 m-1">
                          Order #{order._id.slice(-6)}
                        </span>
                        <span className="text-xs text-slate-400 m-1">{order.date}</span>
                      </div>
    
                      <div className="flex flex-wrap gap-4 md:gap-6 m-1">
                        <InfoPair label="Total" value={`$${order.price.toFixed(2)}`} />
                        <InfoPair label= "Payment Status" value = {order.payment_status}/>
                        <InfoPair label= "Delivery Status" value = {order.delivery_status}/>
                        <InfoPair label= "Order Status" value = {order.order_status}/>
                      </div>
                    </div>
    
                    {/* divider */}
                    <div className="my-4 h-px w-full bg-slate-700" />
    
                    {/* shipping info */}
                    <div className="text-sm leading-6 text-slate-300 m-1">
                      <span className="font-medium text-slate-100">Ship to:</span>{" "}
                      {order.shippingInfo.address} • {order.shippingInfo.phoneNumber} • {order.shippingInfo.postalCode}
                    </div>
    
                    {/* items preview */}
                    <div>
                      {/* items + toggle */}
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => toggle(order._id)}
                          className="inline-flex items-center gap-1 self-start text-xs text-indigo-300 hover:text-indigo-200"
                        >
                          View {expanded === order._id ? "less" : "details"}
                          <ChevronDown
                            size={14}
                            className={`transition-transform ${
                              expanded === order._id ? "rotate-180" : "rotate-0"
                            }`}
                          />
                        </button>
                      </div>
                    </div>
    
                    {/* expanded items list */}
                    {expanded === order._id && (
                      <ul className="divide-y divide-slate-700">
                        {order?.products?.map((it) => (
                          <li key={it.id} className="flex items-center gap-4 m-1 py-3">
                            <img
                              src={it.img[0]}
                              alt={it.name}
                              className="h-10 w-10 rounded bg-slate-700 object-cover"
                            />
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{it.name}</span>
                              <span className="text-xs text-slate-400">
                                Qty: {it.qty} • ${it.price.toFixed(2)}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
}

function InfoPair({ label, value }) {
    return (
      <div className="flex flex-col text-center md:text-left">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {label}
        </span>
        <span className="font-semibold text-slate-100">{value}</span>
      </div>
    );
  }

InfoPair.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

export default History