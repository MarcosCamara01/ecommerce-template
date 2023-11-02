'use client'

import React, { useState, useRef } from 'react';

import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Scrollbar, Zoom } from 'swiper/modules'
import { Loader } from '@/helpers/Loader'
import { MdKeyboardArrowDown } from 'react-icons/md';
import Image from 'next/image';
import { BlurDataUrl } from "@/utils/BlurDataURL"
import { useClientMediaQuery } from '@/hooks/useClientMediaQuery';

import 'swiper/css'
import "swiper/css/zoom";
import 'swiper/css/pagination'

export const ProductImages = ({ images, name }) => {
  const initialImagesToShow = 4;
  const [visibleImages, setVisibleImages] = useState(initialImagesToShow);
  const scrollRef = useRef(null);
  const isMobile = useClientMediaQuery('(max-width: 680px)');

  const showImages = () => {
    if (visibleImages < images.length) {
      setVisibleImages(images.length);
    } else {
      setVisibleImages(initialImagesToShow);
      scrollToButton();
    }
  };

  const scrollToButton = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
    }
  };

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
          {images.map((image, index) => (
            <SwiperSlide key={index}>
              <Images
                image={[image]}
                name={`${name} - Image ${index + 1}`}
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
      <div className='bx-grid' ref={scrollRef}>
        {images.slice(0, visibleImages).map((image, index) => (
          <div className='bx-image' key={index} >
            <Images
              image={[image]}
              name={`${name} - Image ${index + 1}`}
              width={850}
              height={1275}
            />
          </div>
        ))}
        {
          images.length > 4 &&
          (
            <div className='expand-button'>
              <button
                onClick={showImages}
                className={visibleImages < images.length ? "" : "transform"}>
                {visibleImages < images.length
                  ? "Show more"
                  : "Show less"}
                <MdKeyboardArrowDown />
              </button>
            </div>
          )
        }
      </div>
    )
  }
}

function cloudinaryLoader({ src, width, quality }) {
  const params = ['f_auto', 'c_limit', 'w_' + width, 'q_' + (quality || 'auto')];
  const normalizeSrc = (src) => src[0] === '/' ? src.slice(1) : src

  return `https://res.cloudinary.com/dckjqf2cq/image/upload/${params.join(',')}/${normalizeSrc(src)}`;
}

export const Images = async ({ image, name, width, height }) => {
  const placeholder = await BlurDataUrl(image);

  return (
    <Image
      loader={cloudinaryLoader}
      width={width}
      height={height}
      src={image[0]}
      alt={name}
      quality={100}
      className="product-img"
      placeholder='blur'
      blurDataURL={placeholder}
    />
  )
}
