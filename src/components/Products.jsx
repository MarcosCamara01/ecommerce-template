import React, { useState, useEffect } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import '../styles/products.css';
import Link from 'next/link';
import { useCart } from '@/helpers/CartContext';
import { MdAdd } from 'react-icons/md';
import { MdRemove } from 'react-icons/md';

export const Products = ({ products }) => {
  const [loadedProducts, setLoadedProducts] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const { addToCart } = useCart();
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
        {loadedProducts.map((product, index) => {
          return (
            <div className='product-card' key={index}>
              <Link href={`/${product?.category}/${product.quantity ? product.productId : product._id}`}>
                <img src={product?.images[0]} alt={product?.name} className='product-img' loading='lazy' />
              </Link>
              <div className='product-information'>
                <Link href={`/${product?.category}/${product.quantity ? product.productId : product._id}`}>
                  <h2 className='product-name'>{product?.name}</h2>
                </Link>
                <div className='product-price'>
                  {product?.quantity ? (product.price * product.quantity).toFixed(2) : product.price}€
                </div>

                {
                  product.quantity !== undefined && (
                    <div className='content-cart'>
                      <div className="buttons">
                        <button
                          disabled={product.quantity == 1}
                          className='add-remove'
                          onClick={() => addToCart(product.productId, product.color, product.size, -1)}
                        >
                          <MdRemove />
                        </button>
                        <span className='content'>{product.quantity}</span>
                        <button
                          className='add-remove'
                          onClick={() => addToCart(product.productId, product.color, product.size, 1)}
                        ><MdAdd />
                        </button>
                      </div>
                      <div className="color-size">
                        <div className='size'>
                          {product.size}
                        </div>
                        <div className='color'>
                          {product.color}
                        </div>
                      </div>
                    </div>
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
