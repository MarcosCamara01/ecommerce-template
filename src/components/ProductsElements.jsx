"use client"

import React, { useEffect, useState } from 'react';
import '../styles/singleproduct.css';
import { useCart } from '@/hooks/CartContext';
import { FixedComponent } from "@/components/FixedComponent";
import { useSession } from 'next-auth/react';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import axios from 'axios';
import { useClientMediaQuery } from '@/hooks/useClientMediaQuery';
import { colorMapping } from "@/helpers/colorMapping";
import { useVariant } from '@/hooks/VariantContext';
import { toast } from 'sonner';

export const ProductButtons = ({ product }) => {
    const { addToCart } = useCart();
    const { selectedVariant, setSelectedVariant } = useVariant();
    const [selectedSize, setSelectedSize] = useState('');
    const { status } = useSession();

    useEffect(() => {
        if (selectedVariant) {
            setSelectedVariant(product.variants[0])
        }
    }, [product])

    const handleAddToCart = () => {

        if (status === "unauthenticated") {
            const warningMessage = 'You cannot save to cart without logging in.'
            console.warn(warningMessage);
            toast.warning(warningMessage);
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
            const warningMessage = 'You have to select a size.'
            console.warn(warningMessage);
            toast.warning(warningMessage);
        } else if (!selectedVariant && selectedSize) {
            const warningMessage = 'You have to select a color.'
            console.warn(warningMessage);
            toast.warning(warningMessage);
        } else {
            const warningMessage = 'You have to select a color and a size.'
            console.warn(warningMessage);
            toast.warning(warningMessage);
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
                            style={{ backgroundColor: colorMapping[variant.color] }}
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
                    console.error('The _id of the user could not be obtained.');
                    return;
                }

                if (!userCart) {
                    const postResponse = await axios.post(`/api/cart`, {
                        favorites: productId,
                        userId: userId
                    });

                    if (postResponse.status === 200) {
                        setUserCart(postResponse.data);
                        console.log('Favorites created successfully.');
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
                        console.log('Favorites updated successfully.');
                    } else {
                        console.error('Failed to update favorites on the server.');
                    }
                }
            } catch (error) {
                console.error('Error updating/creating favorites on the server:', error);
                toast.error('Error updating/creating favorites on the server.');
            }
        } else if (status === "unauthenticated") {
            const warningMessage = 'You cannot save to favourites without logging in.'
            console.warn(warningMessage);
            toast.warning(warningMessage);
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