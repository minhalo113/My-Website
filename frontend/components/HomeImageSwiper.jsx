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
    <div className='w-full mb-4'>
      <Swiper
        spaceBetween={0}
        slidesPerView={1}
        loop={true}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        modules={[Autoplay]}
        className='w-full h-[300px] md:h-[400px] lg:h-[500px]'
      >
        {items.map(item => (
          <SwiperSlide key={item._id}>
            <a href={item.link} className='block w-full h-full'>
              <img src={item.image.url} className='w-full h-full object-cover' />
            </a>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default HomeImageSwiper;