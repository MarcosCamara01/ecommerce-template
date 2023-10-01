import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useCart } from '@/hooks/CartContext';
import { MdAdd, MdRemove, MdClose } from 'react-icons/md';
import { FaRegHeart, FaHeart } from 'react-icons/fa';
import { useSession } from 'next-auth/react';

export const DeleteButton = ({ product }) => {
    const { userCart, setUserCart, setCartItems } = useCart();

    const handleRemoveFromCart = async (cartItemId) => {
        try {
            const response = await axios.delete(`/api/cart?userId=${userCart.userId}&cartItemId=${cartItemId}`);
            
            if (response.status === 200) {
                setCartItems(response.data.cart);
                setUserCart(response.data);
            } else {
                console.error('Failed to remove product from cart.');
            }
        } catch (error) {
            console.error('Error removing product from cart:', error);
        }
    };

    return (
        <button onClick={() => handleRemoveFromCart(product._id)}><MdClose /></button>
    );
};

export const ProductCartInfo = ({ product }) => {
    const { addToCart } = useCart();

    return (
        <div className='content-cart'>

            {
                product.purchased ?
                    <div className='product-price'>
                        {product?.quantity ? (product.price * product.quantity).toFixed(2) : product.price}€
                    </div>
                    :
                    <div className="buttons">
                        <button
                            disabled={product?.quantity == 1}
                            className='add-remove'
                            onClick={() => addToCart(product?.productId, product.color, product.size, -1)}
                        >
                            <MdRemove />
                        </button>
                        <span className='content'>{product?.quantity}</span>
                        <button
                            className='add-remove'
                            onClick={() => addToCart(product?.productId, product.color, product.size, 1)}
                        >
                            <MdAdd />
                        </button>
                    </div>
            }
            <div className="color-size">
                <div className='size'>
                    {product.size}
                </div>
                <div className='color'>
                    {product.color}
                </div>
            </div>
        </div>
    );
};

export const FavoriteButton = ({ product }) => {
    const { userCart, setUserCart } = useCart();
    const { data: session, status } = useSession();
    const [isFavorite, setIsFavorite] = useState(false);

    useEffect(() => {
        if (userCart && userCart.favorites.includes(product?._id)) {
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

                let updatedFavorites;
                if (isFavorite) {
                    updatedFavorites = userCart.favorites.filter((favId) => favId !== productId);
                } else {
                    updatedFavorites = [...userCart.favorites, productId];
                }

                if (!userCart) {
                    const postResponse = await axios.post(`/api/cart`, {
                        favorites: updatedFavorites,
                        userId: userId
                    });

                    if (postResponse.status === 201) {
                        setUserCart(postResponse.data);
                        console.log('Favorites created on the server');
                    } else {
                        console.error('Failed to create favorites on the server.');
                    }
                } else {
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
            // Si no hay un usuario autenticado, usar cookies.
        }
    };

    return (
        <button onClick={() => addToFavorites(product._id)}>
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
        </button>
    );
};

export const ButtonCheckout = ({ cartWithProducts }) => {
    const { userCart } = useCart();

    const buyProducts = async () => {
        try {
            const lineItems = await cartWithProducts.map((cartItem) => ({
                productId: cartItem.productId,
                quantity: cartItem.quantity,
                variantId: cartItem.variantId,
                size: cartItem.size,
                color: cartItem.color
            }));

            const { data } = await axios.post('/api/stripe/payment', {
                lineItems,
                userId: userCart.userId
            });

            window.location.href = data.session.url;

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <button onClick={buyProducts}>CONTINUAR</button>
    );
};  