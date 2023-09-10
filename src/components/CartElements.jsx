import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useCart } from '@/helpers/CartContext';
import { MdAdd, MdRemove, MdClose } from 'react-icons/md';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import { useSession } from 'next-auth/react';

export const DeleteButton = ({ product }) => {
    const { userToUpdate, setuserToUpdate, setCartItems } = useCart();

    const handleRemoveFromCart = async (cartItemId) => {
        try {
            const response = await axios.delete(`/api/cart?userId=${userToUpdate.userId}&cartItemId=${cartItemId}`);

            if (response.status === 200) {
                setCartItems(response.data.cart);
                setuserToUpdate(response.data);
            } else {
                console.error('Failed to remove product from cart.');
            }
        } catch (error) {
            console.error('Error removing product from cart:', error);
        }
    };

    return (
        <button onClick={() => handleRemoveFromCart(product._id)}><MdClose /></button>
    )
}

export const ProductCartInfo = ({ product }) => {
    const { addToCart } = useCart();

    return (
        <div className='content-cart'>
            <div className="buttons">
                <button
                    disabled={product.quantity == 1}
                    className='add-remove'
                    onClick={() => addToCart(product.productId, product.color, product.size, -1)}
                >
                    <MdRemove />
                </button>
                <span className='content'>{product.quantity}</span>
                <button
                    className='add-remove'
                    onClick={() => addToCart(product.productId, product.color, product.size, 1)}
                >
                    <MdAdd />
                </button>
            </div>
            <div className="color-size">
                <div className='size'>
                    {product.size}
                </div>
                <div className='color'>
                    {product.color}
                </div>
            </div>
        </div>
    )
}

export const FavoriteButton = ({ product }) => {
    const { userCart, setUserCart } = useCart();
    const { data: session, status } = useSession();
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (userCart && userCart.favorites.includes(product._id)) {
            setIsFavorite(true);
        } else {
            setIsFavorite(false);
        }
    }, [userCart, product._id]);

    const addToFavorites = async (productId) => {
        if (status === "authenticated") {
            try {
                const userId = session.user._id;

                if (!userId) {
                    console.error('No se pudo obtener el _id del usuario.');
                    return;
                }

                let updatedFavorites;
                if (isFavorite) {
                    updatedFavorites = userCart.favorites.filter((favId) => favId !== productId);
                } else {
                    updatedFavorites = [...userCart.favorites, productId];
                }

                let userToUpdate = await userCart;
                if (!userToUpdate) {
                    userToUpdate = await axios.post(`/api/cart`, {
                        favorites: updatedFavorites,
                        userId: userId
                    });
                    console.log('Favorites created on the server');
                } else {
                    await axios.put(`/api/cart?id=${userToUpdate._id}`, {
                        favorites: updatedFavorites,
                    });
                    console.log('Favorites updated on the server');
                }

                setUserCart(userToUpdate);
                setIsFavorite(!isFavorite);
            } catch (error) {
                console.error('Error updating/creating favorites on the server:', error);
            }
        } else {
            // Si no hay un usuario autenticado, usar cookies.
        }
    };

    return (
        <button onClick={() => addToFavorites(product._id)}>
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
        </button>
    );
};