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

    useEffect(() => {
        if (status === "authenticated") {
            const userId = session.user._id;
            const fetchUserOrders = async () => {
                try {
                    const orders = await getOrders(userId);
                    setUserOrders(orders);
                    setLoading(false);
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
            return `Entregado ${deliveryDate.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })}`;
        } else {
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
                // Encuentra la variante que coincide con el color de la orden
                const matchingVariant = matchingProduct.variants.find((variant) => variant.color === product.color);
                if (matchingVariant) {
                    return {
                        ...product,
                        name: matchingProduct.name,
                        category: matchingProduct.category,
                        images: [matchingVariant.image],
                        price: matchingProduct.price,
                        purchased: true,
                        color: product.color,
                    };
                }
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
                        <h3>Productos:</h3>
                        <p>Número de producto: {order._id}</p>
                        <p>Total price: {(order.total_price / 100).toFixed(2)}</p>
                        <p>{getDeliveryStatus(order.expectedDeliveryDate)}</p>
                        <Products
                            products={enrichOrderWithProducts(order, products).products}
                        />
                    </div>
                ))
            ) : (
                <p>No hay pedidos disponibles.</p>
            )}
        </div>
    );
}

export default UserOrders;