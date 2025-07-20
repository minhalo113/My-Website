import Banner from './home/Banner'
import HomeCategory from './home/HomeCategory'
import CategoryShowCase from './home/CategoryShowCase'
import LocationSprade from './home/LocationSprade'
import AboutUs from './home/AboutUs'
import AppSection from './home/AppSection'
import Sponsor from './home/Sponsor'
import SEO from '../components/SEO'

export const Home = () => {
  return (
    <>
        <SEO
            title="Toy Haven Store | Home"
            description="Discover the latest toys and deals at Toy Haven Store."
            canonical="https://www.toyhaven.store/"
        />
        <div>
            <Banner/>
            <HomeCategory/>
            <CategoryShowCase/>

            {/* <Register/> */}
            {/* <LocationSprade/> */}
            <AboutUs/>
            {/*<AppSection/>*/}
            {/* <Sponsor/> */}
        </div>
    </>
  )
}

export default Home