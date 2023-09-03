import Link from 'next/link';
import React from 'react';

export const CartProducts = ({ products }) => {
  console.log(products);
  
  return (
    <div className='products-section'>
      {products.map((product) => {
        return (
          <div className='product-card' key={product?._id}>
            <Link href={`/${product?.category}/${product?._id}`}>
              <img src={product?.images[0]} alt={product?.name} className='product-img' />
              <h2 className='product-name'>{product?.name}</h2>
              <div className='product-price'>{product?.price}€</div>
              {product?.quantity > 1 && (
                <div className='product-count'>{product?.quantity}</div>
              )}
            </Link>
          </div>
        );
      })}
    </div>
  );
};
