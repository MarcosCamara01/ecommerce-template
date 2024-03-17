"use client"

import axios from 'axios';
import { ItemDocument } from '@/types/types';
import { serverSession } from '@/helpers/serverSession';
import { useTransition } from 'react';
import { Loader } from '../common/Loader';
import { toast } from 'sonner';

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