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
import { Component } from "react"
import ReactDOM from "react-dom";

import {Amplify} from "aws-amplify";
import awsExports from "../src/aws-exports"
Amplify.configure(awsExports)

import {Provider} from 'react-redux'
import store from "../store/index"
import {Toaster} from "react-hot-toast";

import {lazy, Suspense} from 'react';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const noLayoutRoutes = ["/login", "/sign-up", "/confirmation-code", "/admin-login"];

  return (
    <>
    <Provider store = {store}>
      <Suspense>
    <Head>
        <title>Toy Haven Store | Great Deals On Toys & More</title>
        <meta name = "viewport" content = "width=device-width, initial-scale=1.0"></meta>
        <meta charSet = "UTF-8"/>
        <link rel = "icon" href="/cropped-cropped-DALL·E-2024-11-21-11.20.10-A-vintage-style-logo-featuring-an-open-book-in-the-center-with-an-hourglass-above-it-a-globe-on-the-left-and-a-ships-wheel-on-the-right.-The-logo-i-1.webp"></link>
    </Head>

      {!noLayoutRoutes.includes(router.pathname) && <NavItems />}
      
      <div className="min-vh-100">
        <Component {...pageProps} />
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
      </Provider>
    </>
  );
}

MyApp.propTypes = {
  Component: PropTypes.elementType.isRequired,
  pageProps: PropTypes.object.isRequired,
}

export default MyApp;
