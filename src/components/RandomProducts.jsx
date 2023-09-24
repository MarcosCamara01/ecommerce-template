import React, { useState, useEffect } from 'react';
import '../styles/products.css';
import Link from 'next/link';
import { ProductCartInfo, DeleteButton, FavoriteButton } from "./CartElements";

const shuffleArray = (array) => {
  let shuffled = array.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const RandomProducts = ({ products }) => {
  const [loadedProducts, setLoadedProducts] = useState([]);

  useEffect(() => {
    if (products && products.length > 0) {
      const shuffledProducts = shuffleArray(products);
      const initialBatch = shuffledProducts.slice(0, 6);
      setLoadedProducts(initialBatch);
    }
  }, [products]);

  return (
    <div>
      <h2 className='random-section-h2'>También te podría interesar:</h2>
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
                  product.quantity !== undefined ? (
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
    </div>
  );
};