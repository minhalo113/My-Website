import Link from "next/link";
import PropTypes from "prop-types";
import PageHeader from "../../components/PageHeader";
import SEO from "../../components/SEO";

const BRAND = "#DCA54A";

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 w-full">
      <SEO
        title="About A Figure A Day | Collectible Figures"
        description="Learn about A Figure A Day—curated anime figures, trusted sourcing, and collector-first support."
        canonical="https://www.afigureaday.com/about"
      />
      {PageHeader ? <PageHeader title="About Us" curPage="About Us" /> : null}

        <div className="bg-white p-8 shadow-sm ring-1 ring-slate-200 lg:p-12 p-4">
          <div className="flex flex-col items-start gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
                About <span style={{ color: BRAND }}>A Figure A Day</span>
              </h1>
              <p className="mt-4 text-slate-600">
                Welcome to <strong>A Figure A Day</strong> — a place made by collectors, for collectors.
                Our mission is simple: make it easier to discover beautiful, high-quality anime statues and
                collectibles from trusted global suppliers — all in one place.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Highlight
              title="Curated Selection"
              text="We handpick figures for design, detail and build quality — from premium resin to budget-friendly collectibles."
              icon="🎯"
            />
            <Highlight
              title="Trusted Sourcing"
              text="We partner with verified suppliers and distributors. Every item is reviewed before it goes live."
              icon="🔎"
            />
            <Highlight
              title="Collector Care"
              text="Secure packaging, clear tracking, and responsive support so your figure arrives display-ready."
              icon="📦"
            />
          </div>

        <div className="items-center gap-8 lg:grid-cols-2">
          <div className="bg-white p-8">
            <h2 className="text-2xl font-semibold">Our Philosophy</h2>
            <p className="mt-3 text-slate-600">
              We believe every figure tells a story — of craftsmanship, imagination, and the worlds that
              inspire them. Collecting is more than a hobby; it’s a way to celebrate creativity and connect
              with what you love. We’re here to share that joy, one figure at a time.
            </p>

            <ul className="mt-6 space-y-3 text-slate-700">
              <li className="flex gap-3"><Dot /> Thoughtful curation across limited editions and everyday favorites</li>
              <li className="flex gap-3"><Dot /> Transparent, collector-friendly policies and communication</li>
              <li className="flex gap-3"><Dot /> A welcoming community for both new and veteran collectors</li>
            </ul>
          </div>

            <div className="p-20 bg-white rounded-3xl flex items-center justify-center">
            <img
                src="/images/about-figures.jpg"
                alt="Display shelves of anime figures"
                className="max-h-72 w-auto object-contain"
            />
            </div>

        </div>

          <h2 className="text-2xl font-semibold">Why choose us</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{/* ↑ slightly tighter gap */}
            <MiniCard title="Quality First" text="Only figures we’d proudly display ourselves." />
            <MiniCard title="Global Shipping" text="Reliable carriers and careful packing." />
            <MiniCard title="Secure Checkout" text="Safe payments and order tracking." />
            <MiniCard title="Real Support" text="We actually read and reply to messages." />
          </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-5 p-4">
                <Link
                    href="/shop"
                    className="inline-flex items-center justify-center rounded-xl px-2 py-3 font-semibold text-white shadow-md transition-transform duration-200 hover:scale-[1.03] hover:opacity-90"
                    style={{ backgroundColor: "#DCA54A" }}
                >
                    Browse the collection
                </Link>

                <Link
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-xl px-4 py-3 font-semibold ring-2 ring-[#DCA54A] text-[#8f6a23] bg-[#fffaf0] hover:bg-[#fff0d9] transition-transform duration-200 hover:scale-[1.03] shadow-sm"
                >
                    Contact support
                </Link>
                </div>
          {/* <h2 className="text-2xl font-semibold">Connect with us</h2>
          <p className="mt-3 text-slate-600">Follow our journey for restocks, highlights and behind-the-scenes:</p> */}
{/* 
          <div className="mt-6 grid gap-4 text-center sm:grid-cols-2 lg:grid-cols-3">
            <Social href="https://www.instagram.com/afigureaday" label="Instagram" />
            <Social href="https://www.tiktok.com/@afigureaday" label="Facebook" />
          </div> */}
        </div>




        </div>


     
  );
}

function Highlight({ title, text, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-1">
        <div
          className="m-2 rounded-full text-lg"
        >
          {icon}
        </div>
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-slate-600">{text}</p>
        </div>
      </div>
    </div>
  );
}
Highlight.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
};

function MiniCard({ title, text }) {
  return (
    <div className="rounded-2xl border border-slate-200 p-5">
      <h4 className="font-semibold">{title}</h4>
      <p className="mt-2 text-sm text-slate-600">{text}</p>
    </div>
  );
}
MiniCard.propTypes = {
  title: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired,
};

function Social({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 hover:bg-slate-50"
    >
      <span>{label}</span>
      <span className="text-slate-400">↗</span>
    </a>
  );
}
Social.propTypes = {
  href: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
};

function Dot() {
  return (
    <span
      className="mt-2 inline-block h-2 w-2 flex-none rounded-full"
      style={{ backgroundColor: BRAND }}
    />
  );
}
