import axios from "axios";
import { getProducts } from "./getProducts";
import { toast } from 'sonner'
import Stripe from 'stripe';
import { ItemDocument, OrderDocument, ProductsDocument, VariantsDocument } from "@/types/types";

function generateRandomOrderNumber() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let orderId = '';
    const length = 10;

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * chars.length);
        orderId += chars.charAt(randomIndex);
    }

    return orderId;
}

export const saveOrder = async (
    data: Stripe.Checkout.Session,
    setHasSavedOrder: any,
    cartItems: [ItemDocument]
) => {
    const userId = data.metadata?.userId;

    const products = cartItems.map((item: ItemDocument) => ({
        productId: item.productId,
        quantity: item.quantity,
        size: item.size,
        color: item.color,
    }));

    const randomOrderNumber = generateRandomOrderNumber();

    const newOrder = {
        name: data.customer_details?.name,
        email: data.customer_details?.email,
        phone: data.customer_details?.phone,
        address: {
            line1: data.customer_details?.address?.line1,
            line2: data.customer_details?.address?.line2,
            city: data.customer_details?.address?.city,
            state: data.customer_details?.address?.state,
            postal_code: data.customer_details?.address?.postal_code,
            country: data.customer_details?.address?.country,
        },
        products: products,
        orderId: data.id,
        orderNumber: randomOrderNumber,
        total_price: data.amount_total,
    };

    try {
        const response = await axios.get(`${process.env.NEXT_PUBLIC_APP_URL}/api/orders?userId=${userId}`);
        const userOrders = response.data;

        if (userOrders) {
            const orderIdMatch = userOrders.orders.some((order: OrderDocument) => order.orderId === data.id);
            if (!orderIdMatch) {
                const updatedOrders = [...userOrders.orders, newOrder];
                axios.put(`${process.env.NEXT_PUBLIC_APP_URL}/api/orders?id=${userOrders._id}`, {
                    orders: updatedOrders,
                });
                console.log("Orders successfully updated.");
            } else {
                console.info("This order has already been saved.");
            }

        } else {
            const updatedOrders = [newOrder];
            await axios.post(`${process.env.NEXT_PUBLIC_APP_URL}/api/orders`, {
                userId: userId,
                order: updatedOrders,
            });
            console.info("Order created and saved successfully.");
        }

        setHasSavedOrder(true);
    } catch (error) {
        console.error('Error saving the order:', error);
        toast.error('Error saving the order.');
    }
};

export const getOrders = async (userId: string | undefined) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/orders?userId=${userId}`);
        const userOrders = await response.json();

        if (!userOrders) {
            console.log("No orders were found for the user.");
            return null;
        }

        const ordersWithEnrichedProducts = await Promise.all(
            userOrders.orders.map(async (order: OrderDocument) => {
                const enrichedProducts = await Promise.all(
                    order.products.map(async (product: ProductsDocument) => {
                        const matchingProduct = await getProducts(`?_id=${product.productId}`);
                        if (matchingProduct) {
                            const matchingVariant = matchingProduct.variants.find((variant: VariantsDocument) => variant.color === product.color);
                            if (matchingVariant) {
                                return {
                                    ...product,
                                    name: matchingProduct.name,
                                    category: matchingProduct.category,
                                    image: [matchingVariant.images[0]],
                                    price: matchingProduct.price,
                                    purchased: true,
                                    color: product.color,
                                };
                            }
                        }
                        return product;
                    })
                );
                return {
                    ...order,
                    products: enrichedProducts
                };
            })
        );

        const enrichedUserOrders = {
            ...userOrders,
            orders: ordersWithEnrichedProducts
        };

        return enrichedUserOrders;
    } catch (error) {
        console.error('Error fetching orders:', error);
        toast.error('Error fetching orders.');
        return null;
    }
};
