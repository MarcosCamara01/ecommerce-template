import axios from 'axios';
import React from 'react';
import { useCart } from '@/helpers/CartContext';
import { MdAdd, MdRemove, MdClose } from 'react-icons/md';

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
    )
}

export const ProductInformation = ({ product }) => {
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