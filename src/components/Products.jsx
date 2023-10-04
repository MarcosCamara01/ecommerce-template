"use client"

import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import '../styles/products.css';
import Link from 'next/link';
import { ProductCartInfo, DeleteButton, FavoriteButton } from "./CartElements"
import { Loader } from '@/helpers/Loader';

export const Products = ({ products }) => {
  const [loadedProducts, setLoadedProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  useEffect(() => {
    if (products.length > 0) {
      const initialBatch = products.slice(0, 18);
      setLoadedProducts(initialBatch);

      if (products.length <= 18) {
        setHasMore(false);
      }
    }
  }, [products]);

  const loadMore = () => {
    const nextBatch = products.slice(
      loadedProducts.length,
      loadedProducts.length + 18
    );
    if (nextBatch.length === 0) {
      setHasMore(false);
      return;
    }
    setLoadedProducts([...loadedProducts, ...nextBatch]);
  };

  return (
    <InfiniteScroll
      dataLength={loadedProducts.length}
      next={loadMore}
      hasMore={hasMore}
      loader={<Loader />}
    >
      <div className='products-section'>
        {loadedProducts.map((product, index) => {
          return (
            <div className='product-card' key={index}>
              <Link href={`/${product?.category}/${product.quantity ? product.productId : product._id}`}>
                <img src={product?.images[0]} alt={product?.name} className='product-img' loading='lazy' />
              </Link>
              <div className='product-information'>
                <div className='name-button'>
                  <Link href={`/${product?.category}/${product.quantity ? product.productId : product._id}`}>
                    <h2 className='product-name'>{product?.name}</h2>
                  </Link>
                  {
                    product.quantity ? (
                      product.purchased ?
                        product.quantity > 1 && <span>{product.quantity}</span>
                        :
                        <DeleteButton
                          product={product}
                        />
                    ) :
                      (
                        <FavoriteButton
                          product={product}
                        />
                      )
                  }
                </div>
                {
                  !product.purchased &&
                  <div className='product-price'>
                    {product?.quantity ? (product.price * product.quantity).toFixed(2) : product.price}€
                  </div>
                }
                {
                  product.quantity !== undefined && (
                    <ProductCartInfo
                      product={product}
                    />
                  )
                }
              </div>
            </div>
          );
        })}
      </div>
    </InfiniteScroll>
  );
};