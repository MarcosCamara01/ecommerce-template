"use server"

import Link from 'next/link';
import { format } from 'date-fns';
import { OrderDocument, OrdersDocument } from '@/types/types';
import { getUserOrders } from './action';
import { Suspense } from 'react';
import { Loader } from '@/components/common/Loader';

export async function generateMetadata() {
    return {
        title: `Orders | Ecommerce Template`,
    };
}

const UserOrders = async () => {
    const orders: OrdersDocument | undefined | null = await getUserOrders();

    return (
        <Suspense
            fallback={<div className="flex items-center justify-center height-loader">
                <Loader height={35} width={35} />
            </div>}>
            <Orders orders={orders} />
        </Suspense>
    );
}

const Orders = ({ orders }: { orders: OrdersDocument | undefined | null }) => {
    if (orders === undefined || orders === null) {
        return (
            <div className="flex flex-col items-center justify-center w-full h-[70vh] gap-2 px-4">
                <h2 className="mb-6 text-4xl font-bold">No orders yet</h2>
                <p className="mb-4 text-lg">To create an order add a product to the cart and buy it!</p>
                <Link
                    className="flex font-medium	 items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-[#1F1F1F] hover:border-[#454545]"
                    href="/"
                >
                    Start
                </Link>
            </div>
        )
    } else {
        return (
            <div className="grid items-center justify-between pt-12 grid-cols-auto-fill-350 gap-7">
                {orders.orders.map((order: OrderDocument, index: number) => (
                    <div key={index} className="w-full transition duration-150 border border-solid rounded border-border-primary bg-background-secondary hover:bg-color-secondary">
                        <Link href={`/orders/${order._id}?items=${order.products.reduce((total, product) => total + product.quantity, 0)}`} className='flex flex-col justify-between h-full gap-2 px-4 py-5'>
                            <h4 className='font-semibold'>{`${format(order.purchaseDate, 'dd LLL yyyy')} | ${(order.total_price / 100).toFixed(2)}€ | Items: ${order.products.reduce((total, product) => total + product.quantity, 0)} `}</h4>
                            <p className='text-sm'>Order number: {order.orderNumber}</p>
                        </Link>
                    </div>
                ))}
            </div>
        )
    }
}

export default UserOrders;