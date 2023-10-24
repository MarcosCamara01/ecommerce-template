"use client"

import React, { useEffect, useState } from 'react';
import '../styles/singleproduct.css';
import { useCart } from '@/hooks/CartContext';
import { FixedComponent } from "@/components/FixedComponent";
import { useSession } from 'next-auth/react';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import axios from 'axios';
import { useClientMediaQuery } from '@/hooks/useClientMediaQuery';

export const ProductButtons = ({ product }) => {
    const { addToCart } = useCart();
    const [selectedVariant, setSelectedVariant] = useState(
        product.variants.length === 1 ? product.variants[0] : null
    );
    const [selectedSize, setSelectedSize] = useState('');
    const [warning, setWarning] = useState('none');
    const { status } = useSession();
    const isMobile = useClientMediaQuery('(max-width: 600px)');

    const handleAddToCart = () => {

        if (status === "unauthenticated") {
            const warningMessage = 'YOU CANNOT SAVE TO CART WITHOUT LOGGING IN.'
            setWarning(warningMessage);
            console.warn(warningMessage);
        } else if (selectedVariant && selectedSize) {
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
            const warningMessage = 'YOU HAVE TO SELECT A SIZE.'
            setWarning(warningMessage);
            console.warn(warningMessage);
        } else if (!selectedVariant && selectedSize) {
            const warningMessage = 'YOU HAVE TO SELECT A COLOR.'
            setWarning(warningMessage);
            console.warn(warningMessage);
        } else {
            const warningMessage = 'YOU HAVE TO SELECT A COLOR AND A SIZE.'
            setWarning(warningMessage);
            console.warn(warningMessage);
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
                            title={`Color ${variant.color}`}
                        >
                            <span></span>

                        </button>
                    ))}
                </div>
            </div>

            <div className='section-bot'>
                <button type="submit" onClick={handleAddToCart}>Add to Cart</button>
            </div>

            {warning != "none" &&
                <FixedComponent
                    message={warning}
                    setOpen={setWarning}
                    task={"warning"}
                    isMobile={isMobile}
                />
            }
        </>
    );
};

export const FavoriteButton = ({ product }) => {
    const { userCart, setUserCart } = useCart();
    const { data: session, status } = useSession();
    const [isFavorite, setIsFavorite] = useState(false);
    const [warning, setWarning] = useState('none');
    const isMobile = useClientMediaQuery('(max-width: 600px)');

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
        } else if (status === "unauthenticated") {
            const warningMessage = 'YOU CANNOT SAVE TO FAVOURITES WITHOUT LOGGING IN.'
            setWarning(warningMessage);
            console.warn(warningMessage);
            // Si no hay un usuario autenticado, manejar el estado local de favoritos aquí.
            // utilizar cookies o localStorage para almacenar los favoritos.
        }
    };

    return (
        <>
            <button
                onClick={() => addToFavorites(product._id)}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
                {isFavorite ? <FaHeart /> : <FaRegHeart />}
            </button>

            {warning != "none" &&
                <FixedComponent
                    message={warning}
                    setOpen={setWarning}
                    task={"warning"}
                    isMobile={isMobile}
                />
            }
        </>
    );
};