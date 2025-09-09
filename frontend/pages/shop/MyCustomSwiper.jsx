import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import { useRef, useEffect } from "react";
import PropTypes from 'prop-types';

const ProductSwiper = ({ images, videos, previewImage, onPreviewEnd }) => {
    const swiperRef = useRef(null);

    useEffect(() => {
        if (swiperRef.current && swiperRef.current.swiper) {
            swiperRef.current.swiper.navigation.init();
            swiperRef.current.swiper.navigation.update();
        }
    }, []);

    useEffect(() => {
        const swiper = swiperRef.current?.swiper;
        if (!swiper) return;

        if (previewImage) {
            swiper.autoplay?.stop();
            swiper.slideTo(0);

            const handleSlideChange = () => {
                if (swiper.activeIndex !== 0) {
                    onPreviewEnd && onPreviewEnd();
                }
            };

            swiper.on('slideChange', handleSlideChange);

            return () => {
                swiper.off('slideChange', handleSlideChange);
            };
        } else {
            swiper.autoplay?.start();
        }
    }, [previewImage, onPreviewEnd]);

    const displayImages = previewImage ? [previewImage, ...images] : images;
    const autoplayConfig = videos.length > 0 ? false : {
        delay: 2000, disableOnInteraction: false,
    }

    return (
        <div className="swiper-container pro-single-top">
            <Swiper
                ref={swiperRef} 
                spaceBetween={30}
                slidesPerView={1}
                loop={true} 
                autoplay={autoplayConfig}
                navigation={{
                    prevEl: ".pro-single-next", 
                    nextEl: ".pro-single-prev"  
                }}
                modules={[Autoplay, Navigation]}
                className="mySwiper"
            >
                {displayImages.map((image, index) => (
                    <SwiperSlide key={`img-${index}`}>
                        <div className="single-thumb flex items-center justify-center min-h-[400px] py-4">
                            <img
                                src={image}
                                alt={`Product Image ${index + 1}`}
                                className="max-h-[500px] object-contain"
                            />
                        </div>
                    </SwiperSlide>
                ))}
                {videos.map((video, index) => (
                    <SwiperSlide key={`vid-${index}`}>
                        <div className="single-thumb flex items-center justify-center min-h-[400px] py-4">
                            <video controls className="max-h-[500px] object-contain">
                                <source src={video} type="video/mp4" />
                            </video>
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            <div className="pro-single-prev">
                <i className="icofont-rounded-right"></i>
            </div>
            <div className="pro-single-next">
                <i className="icofont-rounded-left"></i>
            </div>
        </div>
    );
};

ProductSwiper.propTypes = {
    images: PropTypes.arrayOf(PropTypes.string).isRequired,
    videos: PropTypes.arrayOf(PropTypes.string),
    previewImage: PropTypes.string,
    onPreviewEnd: PropTypes.func,
};

ProductSwiper.defaultProps = {
    images: [], videos: [],
    previewImage: null,
    onPreviewEnd: undefined,
};

export default ProductSwiper;
