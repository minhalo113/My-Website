import Link from 'next/link';
import Image from 'next/image';
import PropTypes from 'prop-types';

const subTitle = "Celebrate Your Fandom";
const title = "Find the Perfect Figure for Every Collection";

const HomeCategory = ({ categories = [] }) => {
    return (
        <div className='category-section style-4 padding-tb'>
            <div className="container">
                <div className='section-header text-center'>
                    <span className='subtitle'>{subTitle}</span>
                    <h2 className='title'>{title}</h2>
                </div>
                {/* section card */}
                <div className='section-wrapper' style={{ display: "flex", justifyContent: 'center' }}>
                    <div className='row g-4 justify-content-center row-cols-md-3 row-cols-sm-2 row-cols-1'>
                        {
                            categories.slice(0, 6).map((val) => (
                                <div key={val.productId || val.category} className='col' style={{ display: "flex", justifyContent: 'center' }}>
                                    <Link
                                        href={{
                                            pathname: '/shop',
                                            query: val?.category ? { category: val.category } : {},
                                        }}
                                        className='category-item'
                                    >
                                        <div className='category-inner'>
                                            <div className='category-thumb relative' style={{ position: 'relative', width: '100%', aspectRatio: '1/1' }}>
                                                <Image
                                                    src={val.image}
                                                    alt={val.category}
                                                    fill
                                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                    style={{ objectFit: 'cover' }}
                                                />
                                            </div>

                                            <div className='category-content'>
                                                <span>{val.category}</span>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            )
                            )
                        }
                    </div>
                </div>
            </div>

        </div>
    )
}

HomeCategory.propTypes = {
    categories: PropTypes.array,
};

export default HomeCategory
