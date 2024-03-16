"use client"

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getFavorites } from '@/app/(carts)/wishlist/action';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
    const [userFavorites, setUserFavorites] = useState([]);

    useEffect(() => {
        const fetchUserFavorites = async () => {
            try {
                const favorites = await getFavorites();
                if (favorites !== null) {
                    setUserFavorites(favorites[0]);
                }
            } catch (error) {
                console.error('Error fetching user favorites:', error);
            }
        };

        fetchUserFavorites();
    }, []);

    return (
        <FavoritesContext.Provider value={{ userFavorites, setUserFavorites }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export const useFavorites = () => {
    return useContext(FavoritesContext);
}