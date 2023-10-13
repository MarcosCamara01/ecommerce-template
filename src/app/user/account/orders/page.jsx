"use client"

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { format } from 'date-fns';
import { Loader } from "@/helpers/Loader";
import '@/styles/orders.css';
import { getOrdersWithProducts } from '@/helpers/ordersFunctions';

const UserOrders = () => {
    const { data: session, status } = useSession();
    const [userOrders, setUserOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "authenticated") {
            const userId = session.user._id;
            const fetchUserOrders = async () => {
                const response = await getOrdersWithProducts(userId);
                if (response && Array.isArray(response.orders)) {
                    response.orders.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
                    setUserOrders(response.orders);
                } else {
                    console.log("No orders available.");
                }
                setLoading(false);
            };

            fetchUserOrders();
        }
    }, [status, session]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return format(date, 'dd LLL yyyy');
    };

    return (
        <div className="page-container">
            {loading ? (
                <Loader />
            ) : userOrders.length > 0 ? (
                userOrders.map((order, index) => (
                    <div key={index} className="order-card">
                        <Link href={`/user/account/orders/${order._id}`}>
                            <h4>{`${formatDate(order.purchaseDate)} | ${(order.total_price / 100).toFixed(2)} €`}</h4>
                            <p>Order number: {order.orderNumber}</p>
                            <div className='bx-imgs'>
                                {order.products.map((product, productIndex) => (
                                    <div key={productIndex} className="product-card">
                                        <img src={product.image} alt={product.name} loading='lazy' />
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