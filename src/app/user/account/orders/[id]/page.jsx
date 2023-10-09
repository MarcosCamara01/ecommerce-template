"use client"

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { Products } from '@/components/Products';
import '@/styles/orders.css';
import { useParams } from 'next/navigation';
import { Loader } from "@/helpers/Loader";
import { format } from 'date-fns';
import { getOrdersWithProducts } from '@/helpers/ordersFunctions';

function OrderDetails() {
    const params = useParams();
    const { data: session, status } = useSession();
    const [userOrder, setUserOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const orderId = params.id;

    useEffect(() => {
        if (status === "authenticated" && orderId) {
            const fetchUserOrders = async () => {
                try {
                    const userId = session.user._id;
                    const ordersWithProducts = await getOrdersWithProducts(userId);
                    const order = ordersWithProducts.orders.find((order) => order._id === orderId);
                    setUserOrder(order);
                    setLoading(false);
                } catch (error) {
                    console.error("Error al obtener los pedidos:", error);
                }
            };
            fetchUserOrders();
        }
    }, [status, orderId, session.user._id]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return format(date, 'dd LLL yyyy');
    };

    const renderOrderDetails = () => {
        if (userOrder) {
            const totalProducts = userOrder.products.reduce((total, product) => total + product.quantity, 0);

            const productsText = totalProducts === 1 ? "artículo" : "artículos";

            return (
                <div className="order-container">
                    <div className='order-products'>
                        <Products products={userOrder.products} />
                    </div>
                    <div className='order-details'>
                        <div className='details'>
                            <h3>DETALLES DEL PEDIDO</h3>
                            <div className='bx-info'><span>Número de pedido</span> <span>{userOrder?.orderNumber}</span></div>
                            <div className='bx-info'><span>Fecha del pedido</span> <span>{formatDate(userOrder.purchaseDate)}</span></div>
                            <div className='bx-info'><span>Fecha de entrega</span> <span>{formatDate(userOrder.expectedDeliveryDate)}</span></div>
                        </div>
                        <div className='details'>
                            <h3>DIRECCIÓN DE LA ENTREGA</h3>
                            <ul>
                                <li>{userOrder.name}</li>
                                <li>{userOrder.address.line1}</li>
                                {userOrder.address.line2 && (
                                    <li>{userOrder.address.line2}</li>
                                )}
                                <li>{userOrder.address.postal_code} {userOrder.address.city}</li>
                                {userOrder.phone && (
                                    <li>{userOrder.phone}</li>
                                )}
                                <li>{userOrder.email}</li>
                            </ul>
                        </div>
                        <div className='details'>
                            <h3>TOTALES</h3>
                            <div className='bx-info'><span>{totalProducts} {productsText}</span> <span>{(userOrder.total_price / 100).toFixed(2)} €</span></div>
                            <div className='bx-info'><span>Entrega</span> <span>GRATIS</span></div>
                            <div className='bx-info'><span>Descuento total</span> <span>{userOrder.discount ? userOrder.discount : 0} €</span></div>
                            <div className='bx-info'><span>Total</span> <span>{(userOrder.total_price / 100).toFixed(2)} €</span></div>
                            <div className='bx-info'>(IVA incluido)</div>
                        </div>
                    </div>
                </div>
            );
        } else {
            return <h4>Pedido no encontrado.</h4>;
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
