"use client"

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import { Products } from '@/components/Products';
import { useParams } from 'next/navigation';
import { Loader } from "@/helpers/Loader";
import { format } from 'date-fns';
import { getOrders } from '@/helpers/ordersFunctions';
import { useOrders } from '@/hooks/OrdersContext';

const OrderDetails = () => {
    const params = useParams();
    const { data: session, status } = useSession();
    const { orders, setOrders } = useOrders();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const orderId = params.id;

    const detailsH3Styles = "text-lg font-bold mb-5";
    const bxInfoStyles = "w-full flex justify-between mt-3.5 text-sm text-999";
    const detailsLiStyles = "mt-2.5	text-sm	text-999";

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
        if (order) document.title = `Order ${order.orderNumber} | Ecommerce Template`
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
                <div className="flex flex-col-reverse sm:flex-row flex-wrap gap-11 sm:gap-8 justify-between pt-12">
                    <div className='grow-999 basis-0'>
                        <Products
                            products={order.products}
                            extraClassname={"cart-ord-mobile"}
                        />
                    </div>
                    <div className='grow sm:basis-800 sm:sticky top-8 h-full'>
                        <div className='mb-10'>
                            <h3 className={detailsH3Styles}>Order Details</h3>
                            <div className={bxInfoStyles}><span>Order Number</span> <span>{order?.orderNumber}</span></div>
                            <div className={bxInfoStyles}><span>Order Date</span> <span>{formatDate(order.purchaseDate)}</span></div>
                            <div className={bxInfoStyles}><span>Expected Delivery Date</span> <span>{formatDate(order.expectedDeliveryDate)}</span></div>
                        </div>
                        <div className='mb-10 pt-10 border-t border-solid border-border-primary'>
                            <h3 className={detailsH3Styles}>Delivery Address</h3>
                            <ul>
                                <li className={detailsLiStyles}>{order.name}</li>
                                <li className={detailsLiStyles}>{order.address.line1}</li>
                                {order.address.line2 && (
                                    <li className={detailsLiStyles}>{order.address.line2}</li>
                                )}
                                <li className={detailsLiStyles}>{order.address.postal_code} {order.address.city}</li>
                                {order.phone && (
                                    <li className={detailsLiStyles}>{order.phone}</li>
                                )}
                                <li className={detailsLiStyles}>{order.email}</li>
                            </ul>
                        </div>
                        <div className='pt-10 border-t border-solid border-border-primary'>
                            <h3 className={detailsH3Styles}>Totals</h3>
                            <div className={bxInfoStyles}><span>{totalProducts} {productsText}</span> <span>{(order.total_price / 100).toFixed(2)} €</span></div>
                            <div className={bxInfoStyles}><span>Delivery</span> <span>FREE</span></div>
                            <div className={bxInfoStyles}><span>Total Discount</span> <span>{order.discount ? order.discount : 0} €</span></div>
                            <div className={bxInfoStyles}><span>Total</span> <span>{(order.total_price / 100).toFixed(2)} €</span></div>
                            <div className={bxInfoStyles}>(VAT included)</div>
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
