'use client'

import React, { useEffect } from 'react';

import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Scrollbar, Zoom } from 'swiper/modules'
import { Loader } from '@/helpers/Loader'
import Image from 'next/image';
import { useClientMediaQuery } from '@/hooks/useClientMediaQuery';
import { useVariant } from '@/hooks/VariantContext';

import 'swiper/css'
import "swiper/css/zoom";
import 'swiper/css/pagination'

export const ProductImages = ({ name }) => {
  const { selectedVariant } = useVariant();
  const isMobile = useClientMediaQuery('(max-width: 680px)');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedVariant])

  if (isMobile === null) {
    return <Loader />
  }

  if (isMobile) {
    return (
      <div className='container'>
        <Swiper
          modules={[Zoom, Pagination, Scrollbar]}
          scrollbar={{ draggable: true }}
          pagination={{ clickable: true }}
          loop={true}
          zoom={true}
        >
          {selectedVariant.images.map((image, index) => (
            <SwiperSlide key={index}>
              <Images
                image={[image]}
                name={`${name} ${selectedVariant.color} - Image ${index + 1}`}
                width={384}
                height={576}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    )
  } else {
    return (
      <div className='bx-grid'>
        {selectedVariant.images.map((image, index) => (
          <div className='bx-image' key={index} >
            <Images
              image={[image]}
              name={`${name} - Image ${index + 1}`}
              width={850}
              height={1275}
            />
          </div>
        ))}
      </div>
    )
  }
}

function cloudinaryLoader({ src, width, quality }) {
  const params = ['f_auto', 'c_limit', 'w_' + width, 'q_' + (quality || 'auto')];
  const normalizeSrc = (src) => src[0] === '/' ? src.slice(1) : src

  return `https://res.cloudinary.com/dckjqf2cq/image/upload/${params.join(',')}/${normalizeSrc(src)}`;
}

export const Images = ({ image, name, width, height }) => {
  return (
    <Image
      loader={cloudinaryLoader}
      width={width}
      height={height}
      src={image[0]}
      alt={name}
      quality={100}
      loading='lazy'
      className="product-img"
    />
  )
}
