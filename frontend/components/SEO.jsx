import Head from 'next/head'
import PropTypes from 'prop-types'

const DEFAULT_TITLE = 'A Figure A Day'
const DEFAULT_DESCRIPTION =
  'A Figure A Day curates anime statues and collectibles with daily deals and dependable support.'
const DEFAULT_KEYWORDS =
  'anime figures, collectible statues, a figure a day, scale figures, anime merch'
const DEFAULT_CANONICAL = 'https://www.afigureaday.com/'
const DEFAULT_IMAGE = '/images/logo/myLogoResize.png'
const SITE_NAME = 'A Figure A Day'

const SEO = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical = DEFAULT_CANONICAL,
  image = DEFAULT_IMAGE,
  noindex = false,
  structuredData,
}) => {
  const robots = noindex ? 'noindex,nofollow' : 'index,follow'

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} key="canonical" />

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image || DEFAULT_IMAGE} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image || DEFAULT_IMAGE} />

      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      )}
    </Head>
  )
}

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  canonical: PropTypes.string,
  image: PropTypes.string,
  noindex: PropTypes.bool,
  structuredData: PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
}

export default SEO
