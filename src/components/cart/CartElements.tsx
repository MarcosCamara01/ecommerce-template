"use client"

import axios from 'axios';
import { useCart } from '@/hooks/CartContext';
import { MdAdd, MdRemove, MdClose } from 'react-icons/md';
import { useClientMediaQuery } from '@/hooks/useClientMediaQuery';
import { toast } from 'sonner';
import { EnrichedProducts, ItemDocument } from '@/types/types';

export const DeleteButton = ({ product }: { product: EnrichedProducts }) => {
    const { userCart, setUserCart, setCartItems } = useCart();

    const handleRemoveFromCart = async (cartItemId: string) => {
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

export const ProductCartInfo = ({ product }: { product: EnrichedProducts }) => {
    const { addToCart } = useCart();
    const isMobile = useClientMediaQuery('(max-width: 600px)');

    const quantityButtons = () => {
        if (product.purchased) {
            return (
                <div>
                    {product?.quantity ? (product.price * product.quantity).toFixed(2) : product.price}€
                </div>
            )
        } else {
            return (
                <div className="flex bg-black w-min">
                    <button
                        disabled={product?.quantity == 1}
                        className='flex items-center justify-center w-8 h-8 p-2 border border-solid rounded-l border-border-primary '
                        onClick={() => addToCart(product?.productId, product.color, product.size, -1)}
                    >
                        <MdRemove />
                    </button>
                    <span className='flex items-center justify-center w-8 h-8 p-2 text-sm border-solid border-y border-border-primary'>{product?.quantity}</span>
                    <button
                        className='flex items-center justify-center w-8 h-8 p-2 border border-solid rounded-r border-border-primary'
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
                <div className="flex">
                    <div className='text-sm pr-2.5 border-r'>
                        {product.size}
                    </div>
                    <div className='text-sm pl-2.5'>
                        {product.color}
                    </div>
                </div>
                <div className='flex items-center justify-between'>
                    {quantityButtons()}
                </div>
            </>
        );
    } else {
        return (
            <div className='flex items-center justify-between'>
                {quantityButtons()}

                <div className="flex">
                    <div className='text-sm pr-2.5 border-r'>
                        {product.size}
                    </div>
                    <div className='text-sm pl-2.5'>
                        {product.color}
                    </div>
                </div>
            </div>
        );
    }
};

export const ButtonCheckout = ({ cartWithProducts }: { cartWithProducts: ItemDocument[] }) => {
    const { userCart } = useCart();

    const buyProducts = async () => {
        try {
            const lineItems = cartWithProducts.map((cartItem: ItemDocument) => ({
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
        <button
            onClick={buyProducts}
            className='w-full h-20 transition duration-150 border-l border-solid bg-background-secondary border-border-primary ease hover:bg-color-secondary'
        >CONTINUE</button>
    );
};  