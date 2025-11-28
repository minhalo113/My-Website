import Banner from './home/Banner'
import HomeCategory from './home/HomeCategory'
import CategoryShowCase from './home/CategoryShowCase'
import LocationSprade from './home/LocationSprade'
import AboutUs from './home/AboutUs'
import AppSection from './home/AppSection'
import Sponsor from './home/Sponsor'
import SEO from '../components/SEO'
import api from '../src/api/api'

import PropTypes from 'prop-types';

export const Home = ({ products, categorys, featuredCategories, showcaseProducts }) => {
  return (
    <>
      <SEO
        title="A Figure A Day | Home"
        description="Discover daily deals on curated anime figures and collectibles from A Figure A Day."
        canonical="https://www.afigureaday.com/"
      />
      <div>
        <Banner products={products} categorys={categorys} />
        <HomeCategory categories={featuredCategories} />
        <CategoryShowCase initialProducts={showcaseProducts} allCategories={categorys} />

        {/* <Register/> */}
        {/* <LocationSprade/> */}
        <AboutUs />
        {/*<AppSection/>*/}
        {/* <Sponsor/> */}
      </div>
    </>
  )
}

export async function getServerSideProps() {
  try {
    const [productsRes, categorysRes, swiperRes, featuredRes, showcaseRes] = await Promise.all([
      api.get('/customers-products-get'),
      api.get('/customers-category-get'),
      // api.get('/home-swiper-get'),
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
        // swiperItems: swiperRes.data.items || [],
        featuredCategories: featuredRes.data.categories || [],
        showcaseProducts: showcaseRes.data.products || [],
      },
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

export default Home