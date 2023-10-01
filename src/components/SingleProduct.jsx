import React, { useState } from 'react';
import '../styles/singleproduct.css';
import { useCart } from '@/hooks/CartContext';
import { FixedComponent } from "@/components/FixedComponent";

export const SingleProduct = ({ product }) => {
    const { addToCart } = useCart();
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [selectedSize, setSelectedSize] = useState('');
    const [error, setError] = useState('none');

    const handleAddToCart = () => {
        if (selectedVariant && selectedSize) {
            const quantity = 1;
            addToCart(
                product._id,
                selectedVariant.color,
                selectedSize,
                quantity,
                selectedVariant.priceId,
                selectedVariant.variantId
            );
        } else {
            const errorMessage = 'TIENES QUE SELECCIONAR UN COLOR Y UNA TALLA.'
            setError(errorMessage);
            console.error(errorMessage);
        }
    };

    const allImages = product.images.concat(
        product.variants.map((variant) => variant.image).flat()
    );

    return (
        <>
            <div className="product-bx">
                <div className="img-bx">
                    <div className='bx-grid'>
                        {allImages.map((image, index) => (
                            <div key={index}>
                                <img
                                    src={image}
                                    alt={`${product.name} - Image ${index + 1}`}
                                    className={`product-img`}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="information-bx sticky">
                    <div className='sections-bx'>
                        <div className="section section-top">
                            <h1>{product.name}</h1>
                            <span>{product.price}€</span>
                            <p>{product.description}</p>
                        </div>

                        <div className='section section-mid'>
                            <div className='sizes'>
                                {product.sizes.map((size, index) => (
                                    <button
                                        key={index}
                                        className={`size-item ${selectedSize === size ? 'selected' : ''}`}
                                        onClick={() => setSelectedSize(size)}
                                    >
                                        <span>{size}</span>
                                    </button>
                                ))}
                            </div>
                            <div className="colors">
                                {product.variants.map((variant, index) => (
                                    <button
                                        key={index}
                                        className={`color-item ${selectedVariant === variant ? 'selected' : ''}`}
                                        style={{ backgroundColor: variant.color }}
                                        onClick={() => setSelectedVariant(variant)}
                                    >
                                        <span></span>

                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className='section-bot'>
                            <button type="submit" onClick={handleAddToCart}>Add to Cart</button>
                        </div>
                    </div>
                </div>
            </div>

            {error != "none" &&
                <FixedComponent
                    message={error}
                    setOpen={setError}
                    task={"Warning"}
                />
            }
        </>
    )
}