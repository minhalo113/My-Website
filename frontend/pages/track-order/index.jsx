import { useState } from "react";
import Link from "next/link";
import PageHeader from "../../components/PageHeader";
import OrderCard from "../../components/orders/OrderCard";
import api from "../../src/api/api";

const BRAND = "#DCA54A";

const TrackOrderPage = () => {
  const [lookupForm, setLookupForm] = useState({ orderRef: "" });
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [order, setOrder] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const handleLookupChange = (e) => {
    const { name, value } = e.target;
    setLookupForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLookup = async (e) => {
    e.preventDefault();
    setLookupError("");
    setLookupLoading(true);
    setHasSearched(true);

    try {
      const payload = {
        orderRef: lookupForm.orderRef.trim(),
      };
      const { data } = await api.post("/guest/orders/lookup", payload);
      setOrder(data.order || null);
      setExpanded(data.order?._id ?? null);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "We couldn't find an order with that reference. Please confirm the number from your confirmation email.";
      setLookupError(message);
      setOrder(null);
      setExpanded(null);
    } finally {
      setLookupLoading(false);
    }
  };

  const toggle = (id) => setExpanded((prev) => (prev === id ? null : id));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <PageHeader title="Track Order" curPage="Track Order" />

      <div className="mx-auto w-full max-w-4xl px-4 py-10 lg:px-8">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-10">
          <h1 className="text-3xl font-semibold text-slate-900">Track your order</h1>
          <p className="mt-3 text-sm text-slate-600">
            Enter the order reference from your confirmation email to check the latest status.
          </p>

          <form onSubmit={handleLookup} className="mt-8 grid gap-6 md:grid-cols-[2fr_auto] md:items-end">
            <div>
              <label className="block text-xs uppercase tracking-wide text-slate-500" htmlFor="orderRef">
                Order reference
              </label>
              <input
                id="orderRef"
                name="orderRef"
                value={lookupForm.orderRef}
                onChange={handleLookupChange}
                placeholder="e.g. 507f1f77bcf86cd799439011"
                className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2"
                style={{ boxShadow: "none", outline: "none", ringColor: BRAND }}
                required
              />
            </div>

            <button
              type="submit"
                            className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#c5923f")}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = BRAND)}
              disabled={lookupLoading}
            >
              {lookupLoading ? "Searching…" : "Find my order"}
            </button>
          </form>

          {lookupError && <p className="mt-4 text-sm text-rose-500">{lookupError}</p>}

          <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-xl font-semibold text-slate-900">Results</h2>

            {!hasSearched && (
              <p className="mt-2 text-sm text-slate-600">
                Your order progress will appear here after you submit the form above. Need help?{" "}
                <Link href="/contact" className="text-blue-600 underline underline-offset-4">
                  Contact support
                </Link>
                .
              </p>
            )}

            {hasSearched && !order && !lookupLoading && !lookupError && (
              <p className="mt-4 text-sm text-slate-600">
                We could not locate an order with that reference. Double-check the number from your confirmation email.
              </p>
            )}

            {order && (
              <div className="mt-6">
                <OrderCard order={order} expanded={expanded} onToggle={toggle} />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default TrackOrderPage;
