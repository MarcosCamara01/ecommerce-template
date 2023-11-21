'use client'

import React, { useEffect, useState } from 'react';

import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Scrollbar, Zoom } from 'swiper/modules'
import Image from 'next/image';
import { useClientMediaQuery } from '@/hooks/useClientMediaQuery';
import { useVariant } from '@/hooks/VariantContext';

import 'swiper/css'
import "swiper/css/zoom";
import 'swiper/css/pagination'

export const ProductImages = ({ name }) => {
  const { selectedVariant } = useVariant();
  const isMobile = useClientMediaQuery('(max-width: 640px)');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedVariant])

  if (isMobile === null) {
    return <div className='w-full h-60vh sm:h-80vh rounded shine'></div>
  }

  if (isMobile) {
    return (
      <div>
        <Swiper
          modules={[Zoom, Pagination, Scrollbar]}
          scrollbar={{ draggable: true }}
          pagination={{ clickable: true }}
          loop={true}
          zoom={true}
          className='rounded-md'
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
      <div className='grid grid-cols-2 gap-0.5 min-w-grid-img'>
        {selectedVariant.images.map((image, index) => (
          <div className='mx-auto inline-block w-full max-w-2xl rounded overflow-hidden' key={index} >
            <Images
              image={[image]}
              name={`${name} ${selectedVariant.color} - Image ${index + 1}`}
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
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoadComplete = () => {
    setImageLoaded(true);
  };

  return (
    <div className={!imageLoaded ? 'relative' : '' }>
      <Image
        loader={cloudinaryLoader}
        width={width}
        height={height}
        src={image[0]}
        alt={name}
        quality={100}
        loading='lazy'
        className="max-w-img w-full"
        onLoadingComplete={handleImageLoadComplete}
      />
      <div className={!imageLoaded ? 'shine absolute top-0 right-0	w-full	h-full' : '' }></div>
    </div>
  )
}
