"use client"

import { useClientMediaQuery } from '@/hooks/useClientMediaQuery';
import { EnrichedProducts } from '@/types/types';
import { addItem, delOneItem } from '@/app/(carts)/cart/action';

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
                            product.category,
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
