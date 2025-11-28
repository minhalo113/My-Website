import React from 'react';
import dynamic from 'next/dynamic';
import Banner from './home/Banner';
import SEO from '../components/SEO';
import api from '../src/api/api';
import PropTypes from 'prop-types';

const HomeCategory = dynamic(() => import('./home/HomeCategory'), {
  loading: () => <div className="min-h-[200px] animate-pulse bg-gray-50" />,
  ssr: true
});

const CategoryShowCase = dynamic(() => import('./home/CategoryShowCase'), {
  loading: () => <div className="min-h-[500px] animate-pulse bg-gray-50" />,
  ssr: true
});

const AboutUs = dynamic(() => import('./home/AboutUs'), {
  ssr: false
});

// const LocationSprade = dynamic(() => import('./home/LocationSprade'));
// const AppSection = dynamic(() => import('./home/AppSection'));
// const Sponsor = dynamic(() => import('./home/Sponsor'));

export const Home = ({ products, categorys, swiperItems, featuredCategories, showcaseProducts }) => {
  return (
    <>
      <SEO
        title="A Figure A Day | Home"
        description="Discover daily deals on curated anime figures and collectibles from A Figure A Day."
        canonical="https://www.afigureaday.com/"
      />
      <div>
        <Banner products={products} categorys={categorys} swiperItems={swiperItems} />

        <HomeCategory categories={featuredCategories} />
        <CategoryShowCase initialProducts={showcaseProducts} allCategories={categorys} />
        <AboutUs />
      </div>
    </>
  )
}

export async function getStaticProps() {
  try {
    const [productsRes, categorysRes, swiperRes, featuredRes, showcaseRes] = await Promise.all([
      api.get('/customers-products-get'),
      api.get('/customers-category-get'),
      api.get('/home-swiper-get'),
      api.get('/customers-featured-categories', { params: { limit: 6 } }),
      api.get('/customers-products-get', {
        params: {
          sort: 'reviews',
          parPage: 12,
        }
      })
    ]);

    return {
      props: {
        products: productsRes.data.products || [],
        categorys: categorysRes.data.categorys || [],
        swiperItems: swiperRes.data.items || [],
        featuredCategories: featuredRes.data.categories || [],
        showcaseProducts: showcaseRes.data.products || [],
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error fetching data for Home page:", error);
    return {
      props: {
        products: [],
        categorys: [],
        swiperItems: [],
        featuredCategories: [],
        showcaseProducts: [],
      },
      revalidate: 60,
    };
  }
}

Home.propTypes = {
  products: PropTypes.array,
  categorys: PropTypes.array,
  swiperItems: PropTypes.array,
  featuredCategories: PropTypes.array,
  showcaseProducts: PropTypes.array,
};

export default Home;