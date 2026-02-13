import PropTypes from "prop-types"
import "./styles/App.css"
import "./styles/animate.css"
import "./styles/bootstrap.min.css"
import "./styles/magnific-popup.css"
import "./styles/swiper.min.css"
import "./styles/style.min.css"
import "./styles/icofont.min.css"
import "./styles/modal.css"
import "./styles/output.css"
import { Barlow } from 'next/font/google'
import dynamic from 'next/dynamic'

const barlow = Barlow({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-barlow',
})

import Head from "next/head"
import NavItems from "../components/NavItems.jsx";
import Footer from "../components/Footer";
const ChatCustomer = dynamic(() => import('../components/ChatCustomer'), {
  ssr: false, // Chat không cần SEO, tắt SSR để giảm tải server
})
import AnnouncementBar from "../components/AnnouncementBar.jsx"
import { useRouter } from "next/router";

import { Provider } from 'react-redux'
import { Toaster } from "react-hot-toast";

import { noLayoutRoutes } from "../router/routes/NoLayoutRoutes"
import { lazy, Suspense } from 'react';
import { privateRoutesAdmin } from "../router/routes/privateRoutesAdmin"

import { CartProvider } from "./../context/CartContext.jsx"
import { AuthProvider } from "../context/AuthContext.jsx"
import { GoogleTagManager } from '@next/third-parties/google'

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  const adminPrivateRoutes = privateRoutesAdmin.find((r) => r.path === router.pathname)
  const customerPrivateRoutes = null

  const getLayout = Component.getLayout || ((page) => page);
  const canonicalPath =
    router.asPath && router.asPath.includes('[') ? '/' : (router.asPath || '/');

  return (
    <>
      <Suspense>
        {/* eslint-disable-next-line no-undef */}
        <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_CONTAINER_ID} />
        <Head>
          <title>A Figure A Day</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta charSet="UTF-8" />
          <meta name="description" content="A Figure A Day curates anime statues and collectibles with daily deals and dependable support." />
          <meta name="keywords" content="anime figures, collectible statues, a figure a day, scale figures, anime merch" />
          <meta name="robots" content="index, follow" />
          <link rel="canonical" href={`https://www.afigureaday.com${canonicalPath}`} key="canonical" />
          <meta property="og:site_name" content="A Figure A Day" />
          <meta property="og:type" content="website" />
          <meta property="og:title" content="A Figure A Day" />
          <meta property="og:description" content="A Figure A Day curates anime statues and collectibles with daily deals and dependable support." />
          <meta property="og:url" content={`https://www.afigureaday.com${canonicalPath}`} />
          <meta property="og:image" content="/images/logo/myLogoResize.png" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content="A Figure A Day" />
          <meta name="twitter:description" content="A Figure A Day curates anime statues and collectibles with daily deals and dependable support." />
          <meta name="twitter:image" content="/images/logo/myLogoResize.png" />
          <link rel="icon" href="/favicon.ico" />
          <link rel="icon" type="image/png" href="/favicon.png" />
          <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
          <link rel="manifest" href="/site.webmanifest" />

          {/* TikTok Pixel Code Start */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
            !function (w, d, t) {
              w.TiktokAnalyticsObject = t;
            var ttq=w[t]=w[t]||[];
            ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],
            ttq.setAndDefer=function(t,e){t[e] = function () { t.push([e].concat(Array.prototype.slice.call(arguments, 0))) }};
            for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
            var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{ },ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{ },ttq._t[e]=+new Date,ttq._o=ttq._o||{ },ttq._o[e]=n||{ };n=document.createElement("script")
          ;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};


            ttq.load('D61VHTJC77U581RV9BLG');
            ttq.page();
          }(window, document, 'ttq');
              `,
            }}
          />
          {/* TikTok Pixel Code End */}

          {/* Meta Pixel Code */}
          <script
            dangerouslySetInnerHTML={{
              __html: `
            !function (f, b, e, v, n, t, s)
            { if (f.fbq) return; n = f.fbq = function () { n.callMethod ?
            n.callMethod.apply(n, arguments) : n.queue.push(arguments) };
            if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '901282609265804');
            fbq('track', 'PageView');
              `,
            }}
          />
          <noscript
            dangerouslySetInnerHTML={{
              __html: `
            <img height="1" width="1" style="display:none"
            src="https://www.facebook.com/tr?id=901282609265804&ev=PageView&noscript=1"
          />
              `,
            }}
          />
          {/* End Meta Pixel Code */}

        </Head>
        <CartProvider>

          <AuthProvider>
            <main className={barlow.className}>
              {!noLayoutRoutes.includes(router.pathname) && !router.pathname.startsWith('/admin') && <AnnouncementBar />}
              {!noLayoutRoutes.includes(router.pathname) && <NavItems />}
              <div className="min-vh-100">
                {
                  <Component {...pageProps} />
                }
              </div>

              {!noLayoutRoutes.includes(router.pathname) && <Footer />}
              {!router.pathname.startsWith('/admin') && <ChatCustomer />}
            </main>
          </AuthProvider>

          <Toaster
            toastOptions={{
              position: "top-right",
              style: {
                background: "#283046",
                color: "white"
              }
            }}
          />
        </CartProvider>
      </Suspense>
    </>
  );
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object.isRequired,
}

export default MyApp;
