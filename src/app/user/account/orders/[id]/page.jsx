"use client"

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { getOrders } from "@/helpers/ordersFunctions";
import { useProductContext } from '@/hooks/ProductContext';
import { Products } from '@/components/Products';
import '@/styles/orders.css';
import { useParams } from 'next/navigation';
import { orderWithProducts } from '@/helpers/ordersFunctions';
import { Loader } from "@/helpers/Loader";
import { format } from 'date-fns';

function OrderDetails() {
    const params = useParams();
    const { data: session, status } = useSession();
    const [userOrders, setUserOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { products } = useProductContext();

    const orderId = params.id;

    useEffect(() => {
        if (status === "authenticated" && orderId) {
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
    }, [status, session, orderId]);

    const findOrderById = (orderId) => {
        return userOrders.orders.find((order) => order._id === orderId);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return format(date, 'dd LLL yyyy');
    };

    const renderOrderDetails = () => {
        const order = findOrderById(orderId);
        console.log(order)
        if (order) {
            const totalProducts = order.products.reduce((total, product) => total + product.quantity, 0);

            const productsText = totalProducts === 1 ? "artículo" : "artículos";

            return (
                <div className="order-container">
                    <div className='order-products'>
                        <Products products={orderWithProducts(order, products).products} />
                    </div>
                    <div className='order-details'>
                        <div className='details'>
                            <h3>DETALLES DEL PEDIDO</h3>
                            <div className='bx-info'><span>Número de pedido</span> <span>{order?.orderNumber}</span></div>
                            <div className='bx-info'><span>Fecha del pedido</span> <span>{formatDate(order.purchaseDate)}</span></div>
                            <div className='bx-info'><span>Fecha de entrega</span> <span>{formatDate(order.expectedDeliveryDate)}</span></div>
                        </div>
                        <div className='details'>
                            <h3>DIRECCIÓN DE LA ENTREGA</h3>
                            <ul>
                                <li>{order.name}</li>
                                <li>{order.address.line1}</li>
                                {order.address.line2 && (
                                    <li>{order.address.line2}</li>
                                )}
                                <li>{order.address.postal_code} {order.address.city}</li>
                                {order.phone && (
                                    <li>{order.phone}</li>
                                )}
                                <li>{order.email}</li>
                            </ul>
                        </div>
                        <div className='details'>
                            <h3>TOTALES</h3>
                            <div className='bx-info'><span>{totalProducts} {productsText}</span> <span>{(order.total_price / 100).toFixed(2)} €</span></div>
                            <div className='bx-info'><span>Entrega</span> <span>GRATIS</span></div>
                            <div className='bx-info'><span>Descuento total</span> <span>{order.discount ? order.discount : 0} €</span></div>
                            <div className='bx-info'><span>Total</span> <span>{(order.total_price / 100).toFixed(2)} €</span></div>
                            <div className='bx-info'>(IVA incluido)</div>
                        </div>
                    </div>
                </div>
            );
        } else {
            return <p>Pedido no encontrado.</p>;
        }
    };

    return (
        <>
            {loading ? (
                <Loader />
            ) : renderOrderDetails()}
        </>
    );
}

export default OrderDetails;
