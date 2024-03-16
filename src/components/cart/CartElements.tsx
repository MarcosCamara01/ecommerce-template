"use client"

import axios from 'axios';
import { useClientMediaQuery } from '@/hooks/useClientMediaQuery';
import { EnrichedProducts, ItemDocument } from '@/types/types';
import { serverSession } from '@/helpers/serverSession';
import { addItem, delItem, delOneItem } from '@/app/(carts)/cart/action';
import { useTransition } from 'react';
import { Loader } from '../Loader';
import { toast } from 'sonner';

export const DeleteButton = ({ product }: { product: EnrichedProducts }) => {
    return (
        <button onClick={() => delItem(
            product.productId,
            product.size,
            product.variantId
        )}>
            <svg
                width="18"
                height="18"
                viewBox="0 0 15 15"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    d="M11.7816 4.03157C12.0062 3.80702 12.0062 3.44295 11.7816 3.2184C11.5571 2.99385 11.193 2.99385 10.9685 3.2184L7.50005 6.68682L4.03164 3.2184C3.80708 2.99385 3.44301 2.99385 3.21846 3.2184C2.99391 3.44295 2.99391 3.80702 3.21846 4.03157L6.68688 7.49999L3.21846 10.9684C2.99391 11.193 2.99391 11.557 3.21846 11.7816C3.44301 12.0061 3.80708 12.0061 4.03164 11.7816L7.50005 8.31316L10.9685 11.7816C11.193 12.0061 11.5571 12.0061 11.7816 11.7816C12.0062 11.557 12.0062 11.193 11.7816 10.9684L8.31322 7.49999L11.7816 4.03157Z"
                    fill="currentColor"
                    fillRule="evenodd"
                    clipRule="evenodd"
                ></path>
            </svg>
        </button>
    );
};

export const ProductCartInfo = ({ product }: { product: EnrichedProducts }) => {
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
                        className='flex items-center justify-center w-8 h-8 p-2 border border-solid rounded-l border-border-primary '
                        onClick={() => delOneItem(
                            product.productId,
                            product.size,
                            product.variantId
                        )}
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 15 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M2.25 7.5C2.25 7.22386 2.47386 7 2.75 7H12.25C12.5261 7 12.75 7.22386 12.75 7.5C12.75 7.77614 12.5261 8 12.25 8H2.75C2.47386 8 2.25 7.77614 2.25 7.5Z"
                                fill="currentColor"
                                fillRule="evenodd"
                                clipRule="evenodd"
                            ></path>
                        </svg>
                    </button>
                    <span className='flex items-center justify-center w-8 h-8 p-2 text-sm border-solid border-y border-border-primary'>{product?.quantity}</span>
                    <button
                        className='flex items-center justify-center w-8 h-8 p-2 border border-solid rounded-r border-border-primary'
                        onClick={() => addItem(
                            product.productId,
                            product.size,
                            product.variantId,
                            product.price
                        )}
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 15 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z"
                                fill="currentColor"
                                fillRule="evenodd"
                                clipRule="evenodd"
                            ></path>
                        </svg>
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
    let [isPending, startTransition] = useTransition();

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

            if (data.statusCode === 500) {
                toast.error(data.message);
                console.error(data.statusCode, data.message);
                return;
            }

            window.location.href = data.session.url;

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <button
            onClick={() => {
                startTransition(() => buyProducts())
            }}
            className='w-full p-2.5 h-full transition duration-150 border-l border-solid bg-background-secondary border-border-primary ease hover:bg-color-secondary'
        >
            {isPending
                ? <Loader height={20} width={20} />
                : "Continue"}
        </button>
    );
};  