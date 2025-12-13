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
import dynamic from 'next/dynamic'

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
        </Head>
        <CartProvider>

          <AuthProvider>
            {!noLayoutRoutes.includes(router.pathname) && !router.pathname.startsWith('/admin') && <AnnouncementBar />}
            {!noLayoutRoutes.includes(router.pathname) && <NavItems />}
            <div className="min-vh-100">
              {
                <Component {...pageProps} />
              }
            </div>

            {!noLayoutRoutes.includes(router.pathname) && <Footer />}
            {!router.pathname.startsWith('/admin') && <ChatCustomer />}
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
