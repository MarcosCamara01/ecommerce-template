import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import '../styles/products.css';
import Link from 'next/link';

export const Products = ({ products }) => {
  const [loadedProducts, setLoadedProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  console.log(products)
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
      loader={<h4>Loading...</h4>}
    >
      <div className='products-section'>
        {loadedProducts.map((product) => {
          return (
            <div className='product-card' key={product?._id}>
              <Link href={`/${product?.category}/${product?._id}`}>
                <img src={product?.images[0]} alt={product?.name} className='product-img' />
                <h2 className='product-name'>{product?.name}</h2>
                <div className='product-price'>{product?.price}€</div>
              </Link>
            </div>
          );
        })}
      </div>
    </InfiniteScroll>

  );
};
