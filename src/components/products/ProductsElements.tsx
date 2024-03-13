"use client"

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import { toast } from 'sonner';
import { EnrichedProducts } from '@/types/types';
import { useFavorites } from '@/hooks/FavoritesContext';
import { addFavorite } from '@/app/(carts)/wishlist/action';

export const FavoriteButton = ({ product }: { product: EnrichedProducts }) => {
    const { status } = useSession();
    const [isFavorite, setIsFavorite] = useState(false);
    const { userFavorites, setUserFavorites } = useFavorites();

    useEffect(() => {
        if (userFavorites && userFavorites.favorites && userFavorites.favorites.includes(product?._id)) {
            setIsFavorite(true);
        } else {
            setIsFavorite(false);
        }
    }, [userFavorites, product?._id]);

    const addToFavorites = async () => {
        if (status === "authenticated") {
            const favorites = await addFavorite(product._id);
            setUserFavorites(favorites);
            setIsFavorite(!isFavorite);
        } else if (status === "unauthenticated") {
            const warningMessage = 'You cannot save to favourites without logging in.';
            console.warn(warningMessage);
            toast.warning(warningMessage);
        }
    };

    return (
        <>
            <button
                onClick={() => addToFavorites()}
                title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
                {isFavorite ? <FaHeart /> : <FaRegHeart />}
            </button>
        </>
    );
};