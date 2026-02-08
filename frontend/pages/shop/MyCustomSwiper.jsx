import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Zoom, Thumbs, FreeMode } from "swiper/modules";
import { useRef, useEffect, useState } from "react";
import Image from 'next/image';
import PropTypes from 'prop-types';
import { ensureHttps } from "../../src/utils/imageUtils";

const ProductSwiper = ({ images, videos, previewImage, onPreviewEnd }) => {
    const swiperRef = useRef(null);
    const [thumbsSwiper, setThumbsSwiper] = useState(null);

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
        }
    }, [previewImage, onPreviewEnd, videos]);

    const displayImages = previewImage ? [previewImage, ...images] : images;

    return (
        <div className="swiper-container pro-single-top">
            <Swiper
                ref={swiperRef}
                spaceBetween={30}
                slidesPerView={1}
                loop={true}
                navigation={{
                    prevEl: ".pro-single-next",
                    nextEl: ".pro-single-prev"
                }}
                thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                modules={[Navigation, Zoom, Thumbs]}
                zoom={true}
                className="mySwiper"
            >
                {displayImages.map((image, index) => (
                    <SwiperSlide key={`img-${index}`}>
                        <div className="single-thumb flex items-center justify-center h-[500px] w-full relative py-4" style={{ height: '500px' }}>
                            <div className="swiper-zoom-container w-full h-full">
                                <Image
                                    src={ensureHttps(image)}
                                    alt={`Product Image ${index + 1}`}
                                    fill
                                    className="object-contain"
                                />
                            </div>
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

            <div className="mt-4">
                <Swiper
                    onSwiper={setThumbsSwiper}
                    loop={false}
                    spaceBetween={10}
                    slidesPerView={4}
                    freeMode={true}
                    watchSlidesProgress={true}
                    modules={[FreeMode, Navigation, Thumbs]}
                    className="mySwiper2"
                    breakpoints={{
                        640: { slidesPerView: 4 },
                        768: { slidesPerView: 5 },
                        1024: { slidesPerView: 6 },
                    }}
                >
                    {displayImages.map((image, index) => (
                        <SwiperSlide key={`thumb-${index}`} className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                            <div className="w-full h-20 relative border border-gray-200 rounded overflow-hidden">
                                <Image
                                    src={ensureHttps(image)}
                                    alt={`Thumbnail ${index + 1}`}
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </SwiperSlide>
                    ))}
                    {videos.map((video, index) => (
                        <SwiperSlide key={`thumb-vid-${index}`} className="cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                            <div className="w-full h-20 relative border border-gray-200 rounded overflow-hidden flex items-center justify-center bg-gray-100">
                                <i className="icofont-play-alt-2 text-2xl text-gray-600"></i>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
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
