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

import Head from "next/head"
import NavItems from "../components/NavItems";
import Footer from "../components/Footer";
import { useRouter } from "next/router";

import {Provider} from 'react-redux'
import {Toaster} from "react-hot-toast";

import { noLayoutRoutes } from "../router/routes/NoLayoutRoutes"
import {lazy, Suspense} from 'react';
import ProtectRoute from "../router/routes/ProtectedRoutes"
import { privateRoutesAdmin } from "../router/routes/privateRoutesAdmin"

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const adminPrivateRoutes = privateRoutesAdmin.find((r) => r.path === router.pathname)
  const customerPrivateRoutes = null

  const getLayout = Component.getLayout || ((page) => page);
  return (
    <>
      <Suspense>
    <Head>
        <title>Toy Haven Store | Great Deals On Toys & More</title>
        <meta name = "viewport" content = "width=device-width, initial-scale=1.0"></meta>
        <meta charSet = "UTF-8"/>
        <link rel = "icon" href="/cropped-cropped-DALL·E-2024-11-21-11.20.10-A-vintage-style-logo-featuring-an-open-book-in-the-center-with-an-hourglass-above-it-a-globe-on-the-left-and-a-ships-wheel-on-the-right.-The-logo-i-1.webp"></link>
    </Head>

      {!noLayoutRoutes.includes(router.pathname) && <NavItems />}
      
      <div className="min-vh-100">
        {
          <Component {...pageProps}/>
        }
      </div>

      {!noLayoutRoutes.includes(router.pathname) && <Footer />}
      
      <Toaster
          toastOptions={{
            position: "top-right",
            style: {
              background: "#283046",
              color: "white"
            }
          }}
      />
      </Suspense>
    </>
  );
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object.isRequired,
}

export default MyApp;
