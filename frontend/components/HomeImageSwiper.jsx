import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import Image from 'next/image';
import PropTypes from 'prop-types';
import 'swiper/css';

const HomeImageSwiper = ({ items = [] }) => {

  return (
    <div className="w-full">
      <Swiper
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        modules={[Autoplay]}
        className="w-full max-h-[500px]"
      >
        {items.map((item, index) => (
          <SwiperSlide key={item._id} className="flex justify-center items-center">
            <a href={item.link} className="block w-full h-full relative" style={{ height: '500px' }}>
              <Image
                src={item.image.url}
                alt="Banner"
                fill
                sizes="100vw"
                style={{ objectFit: 'contain' }}
                priority={index === 0}
              />
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

HomeImageSwiper.propTypes = {
  items: PropTypes.array,
};

export default HomeImageSwiper;
