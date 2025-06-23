import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import api from '../src/api/api';
import 'swiper/css';

const HomeImageSwiper = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await api.get('/home-swiper-get');
        setItems(data.items);
      } catch (err) {
        console.log(err);
      }
    };
    fetch();
  }, []);

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
        {items.map((item) => (
          <SwiperSlide key={item._id} className="flex justify-center items-center">
            <a href={item.link} className="block w-full h-full">
              <img
                src={item.image.url}
                className="mx-auto w-full max-h-[500px] object-contain"
                alt="Banner"
              />
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HomeImageSwiper;
