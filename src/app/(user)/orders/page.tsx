"use server"

import Link from 'next/link';
import { format } from 'date-fns';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/libs/auth";
import { getOrders } from '@/helpers/ordersFunctions';
import { Images } from '@/components/products/ProductImages';
import { EnrichedOrders, EnrichedProducts } from '@/types/types';

export async function generateMetadata() {
    return {
        title: `Orders | Ecommerce Template`,
    };
}

const UserOrders = async () => {
    let userOrders = [];

    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user._id;
        const response = await getOrders(userId);
        if (response && Array.isArray(response.orders)) {
            response.orders.sort((a: any, b: any) => {
                const dateA = new Date(a.purchaseDate).getTime();
                const dateB = new Date(b.purchaseDate).getTime();
                return dateB - dateA;
            });

            userOrders = response.orders
        } else {
            console.log("No orders available.");
        }
    } catch (error) {
        console.error("Error fetching orders:", error);
    }

    const formatDate = (dateString: string) => {
        const date = dateString ? new Date(dateString) : null;
        return date ? format(date, 'dd LLL yyyy') : 'Date not found';
    };

    return (
        <div className="grid items-center justify-between pt-12 grid-cols-auto-fill-250 gap-7">
            {userOrders.length >= 1 ? (
                userOrders.map((order: EnrichedOrders, index: number) => (
                    <div key={index} className="w-full px-5 transition duration-150 border border-solid rounded py-7 border-border-primary bg-background-secondary h-260 ease hover:bg-color-secondary">
                        <Link href={`/orders/${order._id}`} className='flex flex-col justify-between h-full'>
                            <div>
                                <h4 className='font-semibold'>{`${formatDate(order.purchaseDate)} | ${(order.total_price / 100).toFixed(2)} €`}</h4>
                                <p className='text-sm'>Order number: {order.orderNumber}</p>
                            </div>
                            <div className='flex gap-2.5 overflow-x-auto pb-2.5'>
                                {order.products.map((product: EnrichedProducts, productIndex: number) => (
                                    <div key={productIndex} className="block w-20 orders-img">
                                        <Images
                                            width={80}
                                            height={120}
                                            image={product.image}
                                            name={product.name}
                                            priority={index === 0 ? true : false}
                                        />
                                    </div>
                                ))}
                            </div>
                        </Link>
                    </div>
                ))
            ) :
                <div className="flex flex-col items-center justify-center w-full h-[70vh] gap-2 px-4">
                    <h2 className="mb-6 text-4xl font-bold">No orders yet</h2>
                    <p className="mb-4 text-lg">To create an order add a product to the cart and buy it!</p>
                    <Link
                        className="flex font-medium	 items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-[#1F1F1F] hover:border-[#454545]"
                        href="/"
                    >
                        Start
                    </Link>
                </div>
            }
        </div>
    );
}

export default UserOrders;