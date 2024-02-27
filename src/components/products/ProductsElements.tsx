"use client"

import React, { useEffect, useState } from 'react';
import { useCart } from '@/hooks/CartContext';
import { useSession } from 'next-auth/react';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import axios from 'axios';
import { colorMapping } from "@/helpers/colorMapping";
import { useVariant } from '@/hooks/VariantContext';
import { toast } from 'sonner';
import { EnrichedProducts, ProductDocument, VariantsDocument } from '@/types/types';
import { addToCart } from '@/helpers/clientCart';

export const ProductButtons = ({ product }: { product: ProductDocument }) => {
    const { cartItems, setCartItems, userCart, setUserCart } = useCart();
    const { selectedVariant, setSelectedVariant } = useVariant();
    const [selectedSize, setSelectedSize] = useState('');
    const { status } = useSession();

    useEffect(() => {
        if (selectedVariant) {
            setSelectedVariant(product.variants[0])
        }
    }, [product])

    const handleAddToCart = async () => {

        if (status === "unauthenticated") {
            const warningMessage = 'You cannot save to cart without logging in.'
            console.warn(warningMessage);
            toast.warning(warningMessage);
        } else if (selectedVariant && selectedSize) {
            const quantity = 1;
            await addToCart(
                product._id,
                selectedVariant.color,
                selectedSize,
                quantity,
                selectedVariant.variantId,
                cartItems,
                setCartItems,
                userCart,
                setUserCart
            );
            
            toast.info("Cart updated successfully")
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
            <div className='p-5'>
                <div className='grid grid-cols-4 gap-2.5 justify-center'>
                    {product.sizes.map((size: string, index: number) => (
                        <button
                            key={index}
                            className={`flex items-center justify-center border border-solid border-border-primary px-1 py-1.5 bg-black rounded 
                            transition duration-150 ease hover:border-border-secondary text-13 ${selectedSize === size ? 'bg-white text-black' : ''}`}
                            onClick={() => setSelectedSize(size)}
                        >
                            <span>{size}</span>
                        </button>
                    ))}
                </div>
                <div className="grid grid-cols-auto-fill-32 gap-2.5	mt-5">
                    {product.variants.map((variant: VariantsDocument, index: number) => (
                        <button
                            key={index}
                            className={`border border-solid border-border-primary w-8 h-8 flex justify-center relative rounded 
                            transition duration-150 ease hover:border-border-secondary ${selectedVariant === variant ? 'border-border-secondary' : ''}`}
                            style={{ backgroundColor: colorMapping[variant.color] }}
                            onClick={() => setSelectedVariant(variant)}
                            title={`Color ${variant.color}`}
                        >
                            <span className={selectedVariant === variant ? 'w-2.5 absolute bottom-selected h-px	bg-white' : ''}></span>

                        </button>
                    ))}
                </div>
            </div>

            <div className='border-t border-solid border-border-primary'>
                <button
                    type="submit"
                    onClick={handleAddToCart}
                    className='w-full p-2 transition duration-150 text-13 ease hover:bg-color-secondary'
                >Add to Cart</button>
            </div>
        </>
    );
};

export const FavoriteButton = ({ product }: { product: EnrichedProducts }) => {
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

    const addToFavorites = async (productId: string) => {
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
                        updatedFavorites = userCart.favorites.filter((favId: string) => favId !== productId);
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
            // If there is no authenticated user, handle local bookmark status here
            // use cookies or localStorage to store favourites
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
        </>
    );
};