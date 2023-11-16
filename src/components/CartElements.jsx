"use client"

import axios from 'axios';
import { useCart } from '@/hooks/CartContext';
import { MdAdd, MdRemove, MdClose } from 'react-icons/md';
import { useClientMediaQuery } from '@/hooks/useClientMediaQuery';
import { toast } from 'sonner';

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
            toast.error('Failed to remove product from cart.');
        }
    };

    return (
        <button onClick={() => handleRemoveFromCart(product._id)}><MdClose /></button>
    );
};

export const ProductCartInfo = ({ product }) => {
    const { addToCart } = useCart();
    const isMobile = useClientMediaQuery('(max-width: 600px)');

    const quantityButtons = () => {
        if (product.purchased) {
            return (
                <div className='product-price'>
                    {product?.quantity ? (product.price * product.quantity).toFixed(2) : product.price}€
                </div>
            )
        } else {
            return (
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
            )
        }
    }

    if (isMobile) {
        return (
            <>
                <div className="color-size">
                    <div className='size'>
                        {product.size}
                    </div>
                    <div className='color'>
                        {product.color}
                    </div>
                </div>
                <div className='content-cart'>
                    {quantityButtons()}
                </div>
            </>
        );
    } else {
        return (
            <div className='content-cart'>
                {quantityButtons()}
                
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
    }
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
        <button onClick={buyProducts}>CONTINUE</button>
    );
};  