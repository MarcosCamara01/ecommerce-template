import Link from 'next/link';
import { format } from 'date-fns';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/libs/auth";
import { getOrders } from '@/helpers/ordersFunctions';
import { Images } from '@/components/products/ProductImages';

export async function generateMetadata() {
    return {
        title: `Orders | Ecommerce Template`,
    };
}

const UserOrders = async () => {
    let userOrders = [];

    try {
        const session = await getServerSession(authOptions);
        const userId = session.user._id;
        const response = await getOrders(userId);
        if (response && Array.isArray(response.orders)) {
            response.orders.sort((a, b) => new Date(b.purchaseDate) - new Date(a.purchaseDate));
            userOrders = response.orders
        } else {
            console.log("No orders available.");
        }
    } catch (error) {

    }

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return format(date, 'dd LLL yyyy');
    };

    return (
        <div className="grid grid-cols-auto-fill-250 items-center justify-between gap-7	pt-12">
            {userOrders.length >= 1 ? (
                userOrders.map((order, index) => (
                    <div key={index} className="py-7 px-5 border border-solid border-border-primary bg-background-secondary rounded w-full h-260 transition duration-150 ease hover:bg-color-secondary">
                        <Link href={`/account/orders/${order._id}`} className='flex flex-col justify-between h-full'>
                            <div>
                                <h4 className='font-semibold'>{`${formatDate(order.purchaseDate)} | ${(order.total_price / 100).toFixed(2)} €`}</h4>
                                <p className='text-sm'>Order number: {order.orderNumber}</p>
                            </div>
                            <div className='flex gap-2.5 overflow-x-auto pb-2.5'>
                                {order.products.map((product, productIndex) => (
                                    <div key={productIndex} className="w-20	block orders-img">
                                        <Images
                                            width={80}
                                            height={120}
                                            image={product.image}
                                            name={product.name}
                                        />
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