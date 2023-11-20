"use client"

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { format } from 'date-fns';
import { Loader } from "@/helpers/Loader";
import { getOrders } from '@/helpers/ordersFunctions';
import { useOrders } from '@/hooks/OrdersContext';
import { Images } from '@/components/ProductImages';

const UserOrders = () => {
    const { data: session, status } = useSession();
    const { orders, setOrders } = useOrders();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orders === null && status === 'authenticated') {
            const userId = session.user._id;
            const fetchUserOrders = async () => {
                const response = await getOrders(userId);
                if (response && Array.isArray(response.orders)) {
                    response.orders.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
                    setOrders(response.orders);
                } else {
                    console.log("No orders available.");
                }

                setLoading(false);
            };

            fetchUserOrders();
        } else if (orders !== null) {
            setLoading(false);
        }

    }, [orders, status]);

    useEffect(() => {
        document.title = "Orders | Ecommerce Template"
    }, [])

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return format(date, 'dd LLL yyyy');
    };

    return (
        <div className="grid grid-cols-auto-fill-250 items-center justify-between gap-7	pt-12">
            {loading ? (
                <Loader />
            ) : orders ? (
                orders.map((order, index) => (
                    <div key={index} className="py-7 px-5 border border-solid border-border-primary bg-background-secondary rounded w-full h-72	transition duration-150 ease hover:bg-color-secondary">
                        <Link href={`/account/orders/${order._id}`} className='flex flex-col justify-between h-full'>
                            <h4>{`${formatDate(order.purchaseDate)} | ${(order.total_price / 100).toFixed(2)} €`}</h4>
                            <p>Order number: {order.orderNumber}</p>
                            <div className='mt-3.5 flex gap-2.5 overflow-x-auto pb-2.5'>
                                {order.products.map((product, productIndex) => (
                                    <div key={productIndex} className="w-20	block orders-img">
                                        <Images
                                            width={80}
                                            height={120}
                                            image={product.image}
                                            name={product.name}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Link>
                    </div>
                ))
            ) :
                <p>No orders available.</p>
            }
        </div>
    );
}

export default UserOrders;