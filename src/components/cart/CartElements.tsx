"use client"

import axios from 'axios';
import { useCart } from '@/hooks/CartContext';
import { MdAdd, MdRemove, MdClose } from 'react-icons/md';
import { useClientMediaQuery } from '@/hooks/useClientMediaQuery';
import { toast } from 'sonner';
import { EnrichedProducts, ItemDocument } from '@/types/types';
import { addToCart, deleteProduct } from '@/helpers/clientCart';
import { useSession } from 'next-auth/react';
import { serverSession } from '@/helpers/serverSession';

export const DeleteButton = ({ product }: { product: EnrichedProducts }) => {
    const { setUserCart, setCartItems } = useCart();
    const { data: session } = useSession();

    const handleRemoveFromCart = async (cartItemId: string) => {
        if (session && session.user._id) {
            const response = await deleteProduct(cartItemId, session);

            if (response && response.status === 200) {
                setCartItems(response.data.cart);
                setUserCart(response.data);
            } else {
                console.error('Failed to remove product from cart.');
                toast.error('Failed to remove product from cart.');
            }
        } else {
            console.error('Failed to remove product from cart.');
            toast.error('Failed to remove product from cart.');
        }
    };

    return (
        <button onClick={() => handleRemoveFromCart(product._id)}><MdClose /></button>
    );
};

export const ProductCartInfo = ({ product }: { product: EnrichedProducts }) => {
    const { cartItems, setCartItems, userCart, setUserCart } = useCart();
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
                        onClick={() => addToCart(
                            product?.productId,
                            product.color,
                            product.size,
                            -1,
                            product.variantId,
                            cartItems,
                            setCartItems,
                            userCart,
                            setUserCart
                        )}
                    >
                        <MdRemove />
                    </button>
                    <span className='flex items-center justify-center w-8 h-8 p-2 text-sm border-solid border-y border-border-primary'>{product?.quantity}</span>
                    <button
                        className='flex items-center justify-center w-8 h-8 p-2 border border-solid rounded-r border-border-primary'
                        onClick={() => addToCart(
                            product?.productId,
                            product.color,
                            product.size,
                            1,
                            product.variantId,
                            cartItems,
                            setCartItems,
                            userCart,
                            setUserCart
                        )}
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
    const buyProducts = async () => {
        try {
            const session = await serverSession();
            const lineItems = cartWithProducts.map((cartItem: ItemDocument) => ({
                productId: cartItem.productId,
                quantity: cartItem.quantity,
                variantId: cartItem.variantId,
                size: cartItem.size,
                color: cartItem.color
            }));

            const { data } = await axios.post('/api/stripe/payment', {
                lineItems,
                userId: session?.user._id
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