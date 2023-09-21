"use client"

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { getOrders } from "@/helpers/ordersFunctions";
import { format } from 'date-fns';
import { orderWithProducts } from '@/helpers/ordersFunctions';
import { useProductContext } from '@/hooks/ProductContext';
import '@/styles/orders.css';

function UserOrders() {
    const { data: session, status } = useSession();
    const [userOrders, setUserOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { products } = useProductContext();

    useEffect(() => {
        if (status === "authenticated") {
            const userId = session.user._id;
            const fetchUserOrders = async () => {
                try {
                    const response = await getOrders(userId);
                    if (Array.isArray(response.orders)) {
                        response.orders.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
                        setUserOrders(response.orders);
                    } else {
                        console.error("Error: 'orders' no es un array:", response);
                    }
                    setLoading(false);
                } catch (error) {
                    console.error("Error al obtener los pedidos:", error);
                }
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
                <p>Cargando...</p>
            ) : userOrders.length > 0 ? (
                userOrders.map((order, index) => (
                    <div key={index} className="order-card">
                        <Link href={`/user/account/orders/${order._id}`}>
                            <h4>{`${formatDate(order.purchaseDate)} | ${(order.total_price / 100).toFixed(2)} €`}</h4>
                            <p>Número de pedido: {order.orderNumber}</p>
                            <div className='bx-imgs'>
                                {orderWithProducts(order, products).products.map((product, productIndex) => (
                                    <img key={productIndex} src={product.images[0]} alt={product.name} loading='lazy' />
                                ))}
                            </div>
                        </Link>
                    </div>
                ))
            ) : (
                <p>No hay pedidos disponibles.</p>
            )}
        </div>
    );
}

export default UserOrders;