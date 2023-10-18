'use client'

import React from 'react'

import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Scrollbar, Zoom } from 'swiper/modules'
import { useClientMediaQuery } from '@/hooks/useClientMediaQuery'
import { Loader } from '@/helpers/Loader'

import 'swiper/css'
import "swiper/css/zoom";
import 'swiper/css/pagination'

export const ProductImages = ({ images, name }) => {
  const isMobile = useClientMediaQuery('(max-width: 680px)');

  if (isMobile === null) {
    return <Loader />
  }

  return (
    <>
      {isMobile ?
        <div className='container'>
          <Swiper
            modules={[Zoom, Pagination, Scrollbar]}
            scrollbar={{ draggable: true }}
            pagination={{ clickable: true }}
            loop={true}
            zoom={true}
          >
            {images.map((image, index) => (
              <SwiperSlide key={index}> 
                  <img
                    src={image}
                    alt={`${name} - Image ${index + 1}`}
                    className="product-img"
                  />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
        :
        <div className='bx-grid'>
          {images.map((image, index) => (
            <div key={index}>
              <img
                src={image}
                alt={`${name} - Image ${index + 1}`}
                className="product-img"
              />
            </div>
          ))}
        </div>
      }
    </>
  )
}
