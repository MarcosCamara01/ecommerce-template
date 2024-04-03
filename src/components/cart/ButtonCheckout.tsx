"use client"

import axios from 'axios';
import { ItemDocument } from '@/types/types';
import { useTransition } from 'react';
import { Loader } from '../common/Loader';
import { toast } from 'sonner';
import { Session } from 'next-auth';

interface ButtonCheckout {
    cartWithProducts: ItemDocument[];
    session: Session | null;
}

const ButtonCheckout = ({ cartWithProducts, session }: ButtonCheckout) => {
    let [isPending, startTransition] = useTransition();

    const buyProducts = async () => {
        if (session === null) {
            toast.error("User information not found");
            return;
        }

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
                userId: session.user._id
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
            className='w-full text-sm p-2.5 h-full transition-all hover:bg-color-secondary'
        >
            {isPending
                ? <Loader height={20} width={20} />
                : "Continue"}
        </button>
    );
};  

export default ButtonCheckout;