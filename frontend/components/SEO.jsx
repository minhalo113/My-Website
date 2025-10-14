import Head from 'next/head'
import PropTypes from 'prop-types'

const SEO = ({ title, description, keywords, canonical, image }) => {
  return (
    <Head>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content="index,follow" />
      {canonical && <link rel="canonical" href={canonical} />}
      {title && <meta property="og:title" content={title} />}
      {description && <meta property="og:description" content={description} />}
      {canonical && <meta property="og:url" content={canonical} />}
      <meta property="og:type" content="website" />
      {image && <meta property="og:image" content={image} />}
    </Head>
  )
}

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  canonical: PropTypes.string,
  image: PropTypes.string,
}

SEO.defaultProps = {
  title: 'A Figure A Day',
  description: 'A Figure A Day curates anime statues and collectibles with daily deals and dependable support.',
  keywords: 'anime figures, collectible statues, a figure a day, scale figures, anime merch',
  canonical: 'https://www.afigureaday.com/',
}

export default SEO