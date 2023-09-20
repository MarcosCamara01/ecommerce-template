"use client"

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { getOrders } from "@/helpers/saveOrder";
import { useProductContext } from '@/hooks/ProductContext';
import { Products } from '@/components/Products';

function UserOrders() {
    const { data: session, status } = useSession();
    const [userOrders, setUserOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { products } = useProductContext();
    const uniqueUsers = {};

    useEffect(() => {
        if (status === "authenticated") {
            const userId = session.user._id;
            // Utiliza async/await para esperar a que la promesa se resuelva
            const fetchUserOrders = async () => {
                try {
                    const orders = await getOrders(userId);
                    setUserOrders(orders);
                    setLoading(false);
                    console.log(orders)
                } catch (error) {
                    console.error("Error al obtener los pedidos:", error);
                }
            };
            fetchUserOrders();
        }
    }, [status, session]);


    const getDeliveryStatus = (dateString) => {
        const deliveryDate = new Date(dateString);
        const today = new Date();

        if (deliveryDate <= today) {
            // Si la fecha es igual o anterior al día de hoy
            return `Entregado ${deliveryDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })}`;
        } else {
            // Si la fecha es posterior al día de hoy
            return `Fecha de entrega estimada: ${deliveryDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })}`;
        }
    };

    const enrichOrderWithProducts = (order, products) => {
        if (!order || !order.products || !Array.isArray(order.products)) {
            return order;
        }

        const enrichedProducts = order.products.map((product) => {
            const matchingProduct = products.find((p) => p._id === product.productId);
            if (matchingProduct) {
                return {
                    ...product,
                    name: matchingProduct.name,
                    category: matchingProduct.category,
                    images: matchingProduct.images,
                    price: matchingProduct.price,
                    purchased: true
                };
            }
            return product;
        });

        return {
            ...order,
            products: enrichedProducts
        };
    };


    return (
        <div className="page-container">
            <h1>Compras realizadas</h1>
            {loading ? (
                <p>Cargando...</p>
            ) : userOrders.orders && userOrders.orders.length > 0 ? (
                userOrders.orders.map((order, index) => (
                    <div key={index}>
                        {uniqueUsers[order.email] ? null : (
                            <div>
                                <p>Nombre: {order.name}</p>
                                <p>Email: {order.email}</p>
                            </div>
                        )}
                        <h3>Productos:</h3>
                        <p>Pedido {order._id}</p>
                        <p>Total price: {(order.total_price / 100).toFixed(2)}</p>
                        <p>{getDeliveryStatus(order.expectedDeliveryDate)}</p>
                        <Products
                            products={enrichOrderWithProducts(order, products).products}
                        />
                        {uniqueUsers[order.email] = true}
                    </div>
                ))
            ) : (
                <p>No hay pedidos disponibles.</p>
            )}
        </div>
    );
}

export default UserOrders;