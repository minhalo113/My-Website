import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import { useRef, useEffect } from "react";
import PropTypes from 'prop-types';

const ProductSwiper = ({ images }) => {
    const swiperRef = useRef(null); 

    useEffect(() => {
        if (swiperRef.current && swiperRef.current.swiper) {
            swiperRef.current.swiper.navigation.init(); 
            swiperRef.current.swiper.navigation.update(); 
        }
    }, []);

    return (
        <div className="swiper-container pro-single-top">
            <Swiper
                ref={swiperRef} 
                spaceBetween={30}
                slidesPerView={1}
                loop={true} 
                autoplay={{
                    delay: 2000,
                    disableOnInteraction: false
                }}
                navigation={{
                    prevEl: ".pro-single-next", 
                    nextEl: ".pro-single-prev"  
                }}
                modules={[Autoplay, Navigation]}
                className="mySwiper"
            >
                {images.map((image, index) => (
                    <SwiperSlide key={index}> 
                        <div className="single-thumb flex items-center justify-center min-h-[400px] py-4">
                        <img src={image} alt={`Product Image ${index + 1}`} className="max-h-[500px] object-contain" />
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
};

ProductSwiper.defaultProps = {
    images: [],
};

export default ProductSwiper;
