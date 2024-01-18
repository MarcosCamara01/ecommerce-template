import { Products } from '@/components/products/Products';
import { format } from 'date-fns';
import { getOrders } from '@/helpers/ordersFunctions';
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/libs/auth";
import { EnrichedOrders, EnrichedProducts } from '@/types/types';

export async function generateMetadata() {
    return {
        title: `Order Details | Ecommerce Template`,
    };
}

const OrderDetails = async ({ params }: { params: { id: string } }) => {
    const orderId = params.id;

    let order = [];

    const detailsH3Styles = "text-lg font-bold mb-5";
    const bxInfoStyles = "w-full flex justify-between mt-3.5 text-sm text-999";
    const detailsLiStyles = "mt-2.5	text-sm	text-999";

    try {
        const session = await getServerSession(authOptions);
        const userId = session?.user._id;
        const response = await getOrders(userId);
        if (response && Array.isArray(response.orders)) {
            const orderFound = response.orders.find((order: EnrichedOrders) => order._id === orderId);
            order = orderFound;
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

    if (order) {
        const totalProducts = order.products.reduce((total: number, product: EnrichedProducts) => total + product.quantity, 0);

        const productsText = totalProducts === 1 ? "item" : "items";

        return (
            <div className="flex flex-col-reverse flex-wrap justify-between pt-12 sm:flex-row gap-11 sm:gap-8">
                <div className='grow-999 basis-0'>
                    <Products
                        products={order.products}
                        extraClassname={"cart-ord-mobile"}
                    />
                </div>
                <div className='h-full grow sm:basis-800 sm:sticky top-8'>
                    <div className='mb-10'>
                        <h3 className={detailsH3Styles}>Order Details</h3>
                        <div className={bxInfoStyles}><span>Order Number</span> <span>{order?.orderNumber}</span></div>
                        <div className={bxInfoStyles}><span>Order Date</span> <span>{formatDate(order.purchaseDate)}</span></div>
                        <div className={bxInfoStyles}><span>Expected Delivery Date</span> <span>{formatDate(order.expectedDeliveryDate)}</span></div>
                    </div>
                    <div className='pt-10 mb-10 border-t border-solid border-border-primary'>
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
}

export default OrderDetails;
