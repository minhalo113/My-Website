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
  title: 'Toy Haven Store',
  description: 'Toy Haven Store offers a wide selection of toys with great deals and fast shipping.',
  keywords: 'toys, kids, games, Toy Haven, online store',
  canonical: 'https://www.toyhaven.store/',
}

export default SEO