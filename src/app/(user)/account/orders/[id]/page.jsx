"use client"

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { Products } from '@/components/Products';
import { useParams } from 'next/navigation';
import { Loader } from "@/helpers/Loader";
import { format } from 'date-fns';
import { getOrders } from '@/helpers/ordersFunctions';
import { useOrders } from '@/hooks/OrdersContext';

import '@/styles/orders.css';

const OrderDetails = () => {
    const params = useParams();
    const { data: session, status } = useSession();
    const { orders, setOrders } = useOrders();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const orderId = params.id;

    useEffect(() => {
        if (orderId && orders === null && status === 'authenticated') {
            const fetchUserOrders = async () => {
                try {
                    const userId = session.user._id;
                    const response = await getOrders(userId);
                    if (response && Array.isArray(response.orders)) {
                        const order = response.orders.find((order) => order._id === orderId);
                        setOrder(order);

                        response.orders.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
                        setOrders(response.orders);
                    } else {
                        console.log("No orders available.");
                    }

                    setLoading(false);
                } catch (error) {
                    console.error("Error fetching orders:", error);
                }
            };

            fetchUserOrders();
        } else if (orderId && orders !== null) {
            const order = orders.find((order) => order._id === orderId);
            setOrder(order);
            setLoading(false);
        }

    }, [orderId, status]);

    useEffect(() => {
        if(order) document.title = `Order ${order.orderNumber} | Ecommerce Template`
    }, [order])

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return format(date, 'dd LLL yyyy');
    };

    const renderOrderDetails = () => {
        if (order) {
            const totalProducts = order.products.reduce((total, product) => total + product.quantity, 0);

            const productsText = totalProducts === 1 ? "item" : "items";

            return (
                <div className="order-container">
                    <div className='order-products'>
                        <Products
                            products={order.products}
                            extraClassname={"cart-ord-mobile"}
                        />
                    </div>
                    <div className='order-details'>
                        <div className='details'>
                            <h3>Order Details</h3>
                            <div className='bx-info'><span>Order Number</span> <span>{order?.orderNumber}</span></div>
                            <div className='bx-info'><span>Order Date</span> <span>{formatDate(order.purchaseDate)}</span></div>
                            <div className='bx-info'><span>Expected Delivery Date</span> <span>{formatDate(order.expectedDeliveryDate)}</span></div>
                        </div>
                        <div className='details'>
                            <h3>Delivery Address</h3>
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
                            <h3>Totals</h3>
                            <div className='bx-info'><span>{totalProducts} {productsText}</span> <span>{(order.total_price / 100).toFixed(2)} €</span></div>
                            <div className='bx-info'><span>Delivery</span> <span>FREE</span></div>
                            <div className='bx-info'><span>Total Discount</span> <span>{order.discount ? order.discount : 0} €</span></div>
                            <div className='bx-info'><span>Total</span> <span>{(order.total_price / 100).toFixed(2)} €</span></div>
                            <div className='bx-info'>(VAT included)</div>
                        </div>
                    </div>
                </div>
            );
        } else {
            return <p>Order not found.</p>;
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
