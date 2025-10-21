import PropTypes from "prop-types";
import { ChevronDown, Clock, Package, Truck, CheckCircle2, XCircle } from "lucide-react";

const BRAND = "#DCA54A";

const OrderCard = ({ order, expanded, onToggle }) => {
  const isExpanded = expanded === order._id;
  const shippingInfo = order.shippingInfo || {};

  const currentStep = getCurrentStep(order); 
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <span className="m-1 text-xs uppercase tracking-wider text-slate-500">
            Order #{order._id?.slice(-6) || ""}
          </span>
          {order.date && <span className="m-1 text-xs text-slate-500">{order.date}</span>}
        </div>

        <div className="m-1 flex flex-wrap items-end gap-4 md:gap-6">
          <InfoPair label="Total" value={formatCurrency(order.price)} />
          {order.payment_status && (
            <InfoPair label="Payment" value={<StatusBadge group="payment" value={order.payment_status} />} />
          )}
          {order.order_status && (
            <InfoPair label="Order" value={<StatusBadge group="order" value={order.order_status} />} />
          )}
          {order.delivery_status && (
            <InfoPair label="Delivery" value={<StatusBadge group="delivery" value={order.delivery_status} />} />
          )}
        </div>
      </div>

      <div className="mt-5">
        <ProgressSteps current={currentStep} terminalLabel={terminalLabel(order)} />
      </div>

      <div className="my-5 h-px w-full bg-slate-200" />

      {(shippingInfo.address || shippingInfo.phoneNumber || shippingInfo.postalCode) && (
        <div className="m-1 text-sm leading-6 text-slate-600">
          <span className="font-medium text-slate-900">Ship to:</span>{" "}
          {[shippingInfo.address, shippingInfo.phoneNumber, shippingInfo.postalCode]
            .filter(Boolean)
            .join("   •   ")}
        </div>
      )}

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

const StatusBadge = ({ group, value }) => {
  const tone = pickTone(group, value);
  const text = titleCase(value);

  if (tone === "bad") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 text-xs font-semibold text-rose-700">
        <XCircle size={12} />
        {text}
      </span>
    );
  }
  if (tone === "brand") {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
        style={{ backgroundColor: BRAND }}
      >
        {text}
      </span>
    );
  }
  if (tone === "soft") {
    return (
      <span
        className="rounded-full px-2 py-0.5 text-xs font-semibold"
        style={{ backgroundColor: "rgba(220,165,74,0.12)", color: "#8f6a23" }}
      >
        {text}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
      {text}
    </span>
  );
};

const Steps = [
  { key: "placed", label: "Placed", icon: Clock },
  { key: "processing", label: "Processing", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "delivered", label: "Delivered", icon: CheckCircle2 },
];

const ProgressSteps = ({ current, terminalLabel }) => {
  const total = Steps.length - 1;
  const step = Math.max(0, Math.min(current, total));

  const DOT = 32;            // dot size (h-8 w-8)
  const PAD = DOT / 2;       // 16px (center inset)
  const GUTTER = 40;         // << shorter bar — was 12px, now 40px

  const trackExpr = `calc(100% - ${(PAD + GUTTER) * 2}px)`;
  const ratio = step / total;
  const fillExpr  = `calc(${trackExpr} * ${ratio})`;

  return (
    <div className="w-full p-2 overflow-hidden">
      <div className="relative my-3" style={{ height: 2 }}>
        {/* Base track */}
        <div
          className="absolute top-0 h-2 rounded-full bg-slate-200"
          style={{ left: PAD + GUTTER, right: PAD + GUTTER }}
        />
        {/* Filled segment */}
        <div
          className="absolute top-0 h-2 rounded-full transition-all duration-700 ease-in-out"
          style={{ left: PAD + GUTTER, width: fillExpr, backgroundColor: BRAND }}
        />

        {Steps.map((s, idx) => {
          const Icon = s.icon;
          const t = idx / total;
          const active = idx <= step;
          const label = idx === total && terminalLabel ? terminalLabel : s.label;
          const leftExpr = `calc(${PAD + GUTTER}px + (${trackExpr}) * ${t})`;

          return (
            <div
              key={s.key}
              className="absolute -top-3 flex flex-col items-center"
              style={{ left: leftExpr, transform: "translateX(-50%)" }}
            >
              <div
                className="flex h-8 w-8 items-center justify-center rounded-full ring-2 transition-all"
                style={{
                  zIndex: 1,
                  backgroundColor: active ? BRAND : "#ffffff",
                  color: active ? "#ffffff" : "#475569",
                  borderColor: active ? "transparent" : "#e2e8f0",
                  boxShadow: active ? "0 2px 6px rgba(0,0,0,0.15)" : "none",
                }}
              >
                <Icon size={16} />
              </div>
              <div
                className={`mt-2 text-xs font-medium ${
                  active ? "text-slate-900" : "text-slate-600"
                }`}
                style={{ minWidth: 64, textAlign: "center" }}
              >
                {label}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ height: 34 }} />
    </div>
  );
};



function getCurrentStep(order) {
  const ds = (order?.delivery_status || "").toLowerCase();
  const os = (order?.order_status || "").toLowerCase();
  const ps = (order?.payment_status || "").toLowerCase();

  if (["delivered", "returned", "cancelled"].includes(ds)) return 3;

  if (["shipped", "out for delivery"].includes(ds)) return 2;
  if (["processing", "warehouse"].includes(ds)) return 1;

  if (ds === "pending") {
    if (["accepted"].includes(os) || ["captured"].includes(ps)) return 1;
    return 0; 
  }

  if (["accepted"].includes(os)) return 1;
  if (["pending"].includes(os) || ["pending"].includes(ps) || ["uncaptured"].includes(ps)) return 0;

  if (os === "rejected" || ps === "rejected") return 3;

  return 0;
}

function terminalLabel(order) {
  const ds = (order?.delivery_status || "").toLowerCase();
  const os = (order?.order_status || "").toLowerCase();
  const ps = (order?.payment_status || "").toLowerCase();

  if (ds === "returned") return "Returned";
  if (ds === "cancelled") return "Cancelled";
  if (os === "rejected" || ps === "rejected") return "Rejected";
  return undefined;
}

function pickTone(group, raw) {
  const v = String(raw || "").toLowerCase();

  if (group === "payment") {
    if (v === "captured") return "brand";
    if (v === "pending" || v === "uncaptured") return "soft";
    if (v === "rejected") return "bad";
  }
  if (group === "order") {
    if (v === "accepted") return "brand";
    if (v === "pending") return "soft";
    if (v === "rejected") return "bad";
  }
  if (group === "delivery") {
    if (["delivered"].includes(v)) return "brand";
    if (["pending", "processing", "warehouse", "shipped", "out for delivery"].includes(v)) return "soft";
    if (["returned", "cancelled"].includes(v)) return "bad";
  }
  return "soft";
}

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
  return String(s).replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const InfoPair = ({ label, value }) => (
  <div className="flex flex-col text-center md:text-left">
    <span className="text-xs uppercase tracking-wide text-slate-500">{label}</span>
    <span className="font-semibold text-slate-900">{value}</span>
  </div>
);

InfoPair.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.node]).isRequired,
};

StatusBadge.propTypes = {
  group: PropTypes.oneOf(["payment", "order", "delivery"]).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

ProgressSteps.propTypes = {
  current: PropTypes.number.isRequired,
  terminalLabel: PropTypes.string,
};

OrderCard.propTypes = {
  order: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    date: PropTypes.string,
    price: PropTypes.number,
    payment_status: PropTypes.string,
    order_status: PropTypes.string,  
    delivery_status: PropTypes.string, 
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

OrderCard.defaultProps = { expanded: null };

export default OrderCard;