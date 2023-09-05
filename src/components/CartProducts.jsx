import Link from 'next/link';
import React from 'react';
import '../styles/CartProducts.css';

export const CartProducts = ({ products }) => {
  console.log(products);
  return (
    <div className='products-section'>
      {products.map((product, index) => {
        return (
          <div className='product-card' key={index}>
            <Link href={`/${product.category}/${product.product}`}>
              <img src={product.image} alt={product.name} className='product-img' />
              <h2 className='product-name'>{product.name}</h2>
              <div className='product-price'>{product.price}€</div>
              {product.quantity > 1 && (
                <div className='product-count'>{product.quantity}</div>
              )}
            </Link>
          </div>
        );
      })}

    </div>
  );
};
