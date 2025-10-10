import PropTypes from "prop-types";
import { ChevronDown, Clock, Package, Truck, CheckCircle2 } from "lucide-react";

const BRAND = "#DCA54A";

const OrderCard = ({ order, expanded, onToggle }) => {
  const isExpanded = expanded === order._id;
  const shippingInfo = order.shippingInfo || {};

  const currentStep = getCurrentStep(order); 

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <span className="m-1 text-xs uppercase tracking-wider text-slate-500">
            Order #{order._id?.slice(-6) || ""}
          </span>
          {order.date && (
            <span className="m-1 text-xs text-slate-500">{order.date}</span>
          )}
        </div>

        <div className="m-1 flex flex-wrap items-end gap-4 md:gap-6">
          <InfoPair label="Total" value={formatCurrency(order.price)} />
          {order.payment_status && (
            <InfoPair label="Payment" value={<Badge tone="brand">{titleCase(order.payment_status)}</Badge>} />
          )}
          {order.delivery_status && (
            <InfoPair label="Delivery" value={<Badge tone="soft">{titleCase(order.delivery_status)}</Badge>} />
          )}
          {order.order_status && (
            <InfoPair label="Order" value={<Badge>{titleCase(order.order_status)}</Badge>} />
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mt-5">
        <ProgressSteps current={currentStep} />
      </div>

      <div className="my-5 h-px w-full bg-slate-200" />

      {/* Ship to */}
      {(shippingInfo.address || shippingInfo.phoneNumber || shippingInfo.postalCode) && (
        <div className="m-1 text-sm leading-6 text-slate-600">
          <span className="font-medium text-slate-900">Ship to:</span>{" "}
          {[shippingInfo.address, shippingInfo.phoneNumber, shippingInfo.postalCode].filter(Boolean).join(" • ")}
        </div>
      )}

      {/* Toggle details */}
      <div className="mt-4 flex">
        <button
          type="button"
          onClick={() => onToggle(order._id)}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
        >
          View {isExpanded ? "less" : "details"}
          <ChevronDown
            size={14}
            className={`transition-transform ${isExpanded ? "rotate-180" : "rotate-0"}`}
          />
        </button>
      </div>

      {/* Items */}
      {isExpanded && Array.isArray(order.products) && order.products.length > 0 && (
        <ul className="divide-y divide-slate-200">
          {order.products.map((item) => (
            <li key={item.id || item._id} className="m-1 flex items-center gap-4 py-3">
              {item.img?.[0] && (
                <img
                  src={item.img[0]}
                  alt={item.name}
                  className="h-12 w-12 rounded border border-slate-200 bg-slate-100 object-cover"
                />
              )}
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-900">{item.name}</span>
                <span className="text-xs text-slate-500">
                  Qty: {item.qty} • {formatCurrency(item.price)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};


const Badge = ({ children, tone }) => {
  if (tone === "brand") {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ backgroundColor: BRAND, color: "white" }}
      >
        {children}
      </span>
    );
  }
  if (tone === "soft") {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ backgroundColor: "rgba(220,165,74,0.12)", color: "#8f6a23" }}
      >
        {children}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
      {children}
    </span>
  );
};

const InfoPair = ({ label, value }) => (
  <div className="flex flex-col text-center md:text-left">
    <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
    <span className="font-semibold text-slate-900">{value}</span>
  </div>
);

const Steps = [
  { key: "placed", label: "Placed", icon: Clock },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const ProgressSteps = ({ current }) => {
  return (
    <div className="flex items-center justify-between gap-2">
      {Steps.map((s, idx) => {
        const active = idx <= current;
        const Icon = s.icon;
        return (
          <div key={s.key} className="flex flex-1 items-center">
            <div
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${
                active ? "border-transparent" : "border-slate-200"
              }`}
              style={active ? { backgroundColor: "rgba(220,165,74,0.12)", color: "#8f6a23" } : {}}
            >
              <div
                className="flex h-6 w-6 items-center justify-center rounded-full"
                style={active ? { backgroundColor: BRAND, color: "white" } : { backgroundColor: "#e2e8f0", color: "#475569" }}
              >
                <Icon size={14} />
              </div>
              <span className="font-medium">{s.label}</span>
            </div>

            {/* connector */}
            {idx < Steps.length - 1 && (
              <div
                className="mx-2 h-0.5 flex-1 rounded"
                style={{ backgroundColor: idx < current ? BRAND : "#e2e8f0" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ---------- utils ---------- */

function formatCurrency(amount) {
  if (typeof amount !== "number") return amount ?? "-";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function titleCase(s) {
  if (!s) return s;
return String(s)
  .replace(/[_-]+/g, " ")
  .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Map your existing order fields to a progress step index (no backend change). */
function getCurrentStep(order) {
  const ds = (order?.delivery_status || "").toLowerCase();
  const os = (order?.order_status || "").toLowerCase();

  if (ds.includes("delivered")) return 3;
  if (ds.includes("shipped")) return 2;
  if (os.includes("processing") || ds.includes("in transit")) return 1;
  if (os.includes("placed") || os.includes("created") || os.includes("paid")) return 0;

  // default: if we have any status, assume at least placed
  if (order?.payment_status || order?.order_status || order?.delivery_status) return 0;
  return 0;
}

/* ---------- prop types ---------- */

OrderCard.propTypes = {
  order: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    date: PropTypes.string,
    price: PropTypes.number,
    payment_status: PropTypes.string,
    delivery_status: PropTypes.string,
    order_status: PropTypes.string,
    shippingInfo: PropTypes.shape({
      address: PropTypes.string,
      phoneNumber: PropTypes.string,
      postalCode: PropTypes.string,
    }),
    products: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        _id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        name: PropTypes.string,
        img: PropTypes.arrayOf(PropTypes.string),
        qty: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        price: PropTypes.number,
      })
    ),
  }).isRequired,
  expanded: PropTypes.string,
  onToggle: PropTypes.func.isRequired,
};

InfoPair.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]).isRequired,
};


Badge.propTypes = {
  children: PropTypes.node.isRequired,
  tone: PropTypes.oneOf(["brand", "soft"]),
};

ProgressSteps.propTypes = {
  current: PropTypes.number.isRequired,
};

OrderCard.defaultProps = { expanded: null };

export default OrderCard;
