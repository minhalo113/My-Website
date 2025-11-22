import Link from "next/link";
import { useContext, useEffect, useState } from "react";
import PageHeader from "../../components/PageHeader";
import OrderCard from "../../components/orders/OrderCard";
import { AuthContext } from "../../context/AuthContext";
import api from "../../src/api/api";
import SEO from "../../components/SEO";

const History = () => {
    const {user} = useContext(AuthContext);
    const [orders, setOrders] = useState([])
    const [expanded, setExpanded] = useState(null);

    const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

    useEffect(() => {
        if(!user){
            setOrders([]);
            return;
        }

        const fetchData = async() => {
            try{
                const customerOrders = await api.get('/customers-orders', {withCredentials: true})
                setOrders(customerOrders.data.orders)
            }catch(err){
                console.log(err)
            }
        }

        fetchData();
    }, [user])

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
          <SEO
            title="Order History | A Figure A Day"
            description="View your past orders from A Figure A Day."
            canonical="https://www.afigureaday.com/history"
            noindex
          />
          <PageHeader title="Order History" curPage="Order History" />

          <div className="mx-auto w-full max-w-6xl px-4 py-10 lg:px-8">
            <h2 className="mb-6 text-2xl font-semibold">
              {user ? 'Your recent orders' : 'Order lookup results'}
            </h2>

            {!user && (
              <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-semibold text-slate-900">Track guest orders</h3>
                <p className="mt-2 text-sm text-slate-600">
                  Sign in to view your full history, or use the guest lookup tool to track a single order.
                </p>
                <Link
                  href="/track-order"
                  className="mt-4 inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Go to Track Order
                </Link>
              </div>
            )}

            {orders.length === 0 ? (
              <p className="text-slate-600">
                {user
                  ? 'You don’t have any orders yet.'
                  : 'Guest tracking results will appear here once you search from the Track Order page.'}
              </p>
            ) : (
              <div className="flex flex-col m-1 gap-4 list-none pl-0">
                {orders.map((order) => (
                  <OrderCard key={order._id} order={order} expanded={expanded} onToggle={toggle} />
                ))}
              </div>
            )}
          </div>
        </div>
      );
}

export default History
