'use client'

import React, { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Scrollbar, Zoom } from 'swiper/modules'
import Image, { ImageLoader } from 'next/image';
import { useVariant } from '@/hooks/VariantContext';

import 'swiper/css'
import "swiper/css/zoom";
import 'swiper/css/pagination'

export const ProductImages = ({ name, isMobile }: { name: string, isMobile: boolean }) => {
  const { selectedVariant } = useVariant();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedVariant])

  if (!selectedVariant || !selectedVariant.images || isMobile === null) {
    return <div className='w-full rounded h-60vh sm:h-80vh shine'></div>
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
          {selectedVariant.images.map((image: string, index: number) => (
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
        {selectedVariant.images.map((image: string, index: number) => (
          <div className='inline-block w-full max-w-2xl mx-auto overflow-hidden rounded' key={index} >
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

const cloudinaryLoader: ImageLoader = ({ src, width, quality }) => {
  const params = ['f_auto', 'c_limit', 'w_' + width, 'q_' + (quality || 'auto')];
  const normalizeSrc = (src: string) => (src[0] === '/' ? src.slice(1) : src);

  return `https://res.cloudinary.com/dckjqf2cq/image/upload/${params.join(',')}/${normalizeSrc(src)}`;
};

export const Images = (
  { image, name, width, height }:
    { image: [string], name: string, width: number, height: number }
) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageLoadComplete = () => {
    setImageLoaded(true);
  };

  return (
    <div className={!imageLoaded ? 'relative' : ''}>
      <Image
        loader={cloudinaryLoader}
        width={width}
        height={height}
        src={image[0]}
        alt={name}
        quality={100}
        loading='lazy'
        className="w-full max-w-img"
        onLoad={handleImageLoadComplete}
      />
      <div className={!imageLoaded ? 'shine absolute top-0 right-0	w-full	h-full' : ''}></div>
    </div>
  )
}
