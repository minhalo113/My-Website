import React from 'react'
import { Swiper, SwiperSlide } from 'swiper/react';
import Image from 'next/image';

import 'swiper/css'
import 'swiper/css/pagination'

import { Autoplay } from 'swiper/modules';

const sponsorList = [
  { imgUrl: "/images/sponsor/01.png", width: 148, height: 49 },
  { imgUrl: "/images/sponsor/02.png", width: 159, height: 46 },
  { imgUrl: "/images/sponsor/03.png", width: 131, height: 58 },
  { imgUrl: "/images/sponsor/04.png", width: 160, height: 50 },
  { imgUrl: "/images/sponsor/05.png", width: 130, height: 50 },
  { imgUrl: "/images/sponsor/06.png", width: 147, height: 40 },];

const Sponsor = () => {
  return (
    <div className='sponsor-section section-bg'>
      <div className='container'>
        <div className='section-wrapper'>
          <div className='sponsor-slider'>
            <Swiper
              slidesPerView={2}
              spaceBetween={20}
              autoplay={
                {
                  delay: 2000,
                  disableOnInteraction: false
                }
              }
              breakpoints={{
                640: {
                  slidesPerView: 2,
                  spaceBetween: 20,
                },
                768: {
                  slidesPerView: 3,
                  spaceBetween: 40,
                },
                1024: {
                  slidesPerView: 4,
                  spaceBetween: 50,
                },
              }}
              modules={[Autoplay]}
              className="mySwiper"
            >
              {
                sponsorList.map((val, i) => (
                  <SwiperSlide key={i}>
                    <div className='sponsor-item'>
                      <div className='sponsor-thumb'>
                        <Image src={val.imgUrl} alt="sponsor" width={val.width} height={val.height} />
                      </div>
                    </div>
                  </SwiperSlide>
                ))
              }
            </Swiper>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sponsor