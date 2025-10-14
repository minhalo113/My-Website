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
            title="A Figure A Day | Home"
            description="Discover daily deals on curated anime figures and collectibles from A Figure A Day."
            canonical="https://www.afigureaday.com/"
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