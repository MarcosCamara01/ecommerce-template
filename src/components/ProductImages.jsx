'use client'

import React, { useState, useRef } from 'react';

import { Swiper, SwiperSlide } from 'swiper/react'
import { Pagination, Scrollbar, Zoom } from 'swiper/modules'
import { useClientMediaQuery } from '@/hooks/useClientMediaQuery'
import { Loader } from '@/helpers/Loader'
import { MdKeyboardArrowDown } from 'react-icons/md';
import { MdKeyboardArrowUp } from 'react-icons/md';

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

  return (
    <>
      {isMobile ? (
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
                  className='product-img'
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      ) : (
        <div className='bx-grid' ref={scrollRef}>
          {images.slice(0, visibleImages).map((image, index) => (
            <div className='bx-image' key={index} >
              <img
                src={image}
                alt={`${name} - Image ${index + 1}`}
                className='product-img'
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
                    ? "SHOW MORE"
                    : "SHOW LESS"}
                  <MdKeyboardArrowDown />
                </button>
              </div>
            )
          }
        </div>
      )}
    </>
  );
}
