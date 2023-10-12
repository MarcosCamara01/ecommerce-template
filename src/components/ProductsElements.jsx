"use client"

import React, { useEffect, useState } from 'react';
import '../styles/singleproduct.css';
import { useCart } from '@/hooks/CartContext';
import { FixedComponent } from "@/components/FixedComponent";
import { useSession } from 'next-auth/react';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import axios from 'axios';

export const ProductButtons = ({ product }) => {
    const { addToCart } = useCart();
    const [selectedVariant, setSelectedVariant] = useState(
        product.variants.length === 1 ? product.variants[0] : null
    );
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
        } else if (selectedVariant && !selectedSize) {
            const errorMessage = 'YOU HAVE TO SELECT A SIZE.'
            setError(errorMessage);
            console.warn(errorMessage);
        } else if (!selectedVariant && selectedSize) {
            const errorMessage = 'YOU HAVE TO SELECT A COLOR.'
            setError(errorMessage);
            console.warn(errorMessage);
        } else {
            const errorMessage = 'YOU HAVE TO SELECT A COLOR AND A SIZE.'
            setError(errorMessage);
            console.warn(errorMessage);
        }
    };

    return (
        <>
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

            {error != "none" &&
                <FixedComponent
                    message={error}
                    setOpen={setError}
                    task={"Warning"}
                />
            }
        </>
    );
};

export const FavoriteButton = ({ product }) => {
    const { userCart, setUserCart } = useCart();
    const { data: session, status } = useSession();
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (userCart && userCart.favorites?.includes(product?._id)) {
            setIsFavorite(true);
        } else {
            setIsFavorite(false);
        }
    }, [userCart, product?._id]);

    const addToFavorites = async (productId) => {
        if (status === "authenticated") {
            try {
                const userId = session.user._id;

                if (!userId) {
                    console.error('No se pudo obtener el _id del usuario.');
                    return;
                }

                if (!userCart) {
                    const postResponse = await axios.post(`/api/cart`, {
                        favorites: productId,
                        userId: userId
                    });

                    if (postResponse.status === 200) {
                        setUserCart(postResponse.data);
                        console.log('Favorites created on the server');
                    } else {
                        console.error('Failed to create favorites on the server.');
                    }
                } else {
                    let updatedFavorites;
                    if (isFavorite) {
                        updatedFavorites = userCart.favorites.filter((favId) => favId !== productId);
                    } else {
                        updatedFavorites = [...userCart.favorites, productId];
                    }

                    const putResponse = await axios.put(`/api/cart?id=${userCart._id}`, {
                        favorites: updatedFavorites,
                    });

                    if (putResponse.status === 200) {
                        setUserCart(putResponse.data);
                        setIsFavorite(!isFavorite);
                        console.log('Favorites updated on the server');
                    } else {
                        console.error('Failed to update favorites on the server.');
                    }
                }
            } catch (error) {
                console.error('Error updating/creating favorites on the server:', error);
            }
        } else {
            // Si no hay un usuario autenticado, puedes manejar el estado local de favoritos aquí.
            // Por ejemplo, puedes utilizar cookies o localStorage para almacenar los favoritos.
        }
    };

    return (
        <button onClick={() => addToFavorites(product._id)}>
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
        </button>
    );
};