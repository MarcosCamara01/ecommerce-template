import Link from "next/link";
import { format } from "date-fns";
import { OrderItem, OrderProduct } from "@/schemas/ecommerce";
import { getUserOrders } from "./action";
import { Suspense } from "react";
import { SVGLoadingIcon } from "@/components/ui/loader";
import { getUser } from "@/libs/supabase/auth/getUser";

export async function generateMetadata() {
  return {
    title: `Orders | Ecommerce Template`,
  };
}

const UserOrders = async () => {
  const user = await getUser();

  if (user) {
    return (
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-[calc(100vh-91px)]">
            <SVGLoadingIcon height={30} width={30} />
          </div>
        }
      >
        <Orders />
      </Suspense>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-91px)] gap-2 px-4">
      <h2 className="mb-6 text-4xl font-bold">NO ORDERS YET</h2>
      <p className="mb-4 text-lg">To view your orders you must be logged in.</p>
      <Link
        className="flex font-medium	 items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-[#1F1F1F] hover:border-[#454545]"
        href="/login"
      >
        Login
      </Link>
    </div>
  );
};

const Orders = async () => {
  const orders: OrderItem[] | undefined | null = await getUserOrders();

  if (orders === undefined || orders === null) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-[80vh] gap-2 px-4">
        <h2 className="mb-6 text-4xl font-bold">NO ORDERS YET</h2>
        <p className="mb-4 text-lg">
          To create an order add a product to the cart and buy it!
        </p>
        <Link
          className="flex font-medium	 items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-[#1F1F1F] hover:border-[#454545]"
          href="/"
        >
          Start
        </Link>
      </div>
    );
  }

  return (
    <div className="grid items-center justify-between pt-12 grid-cols-auto-fill-350 gap-7">
      {orders.map((order: OrderItem, index: number) => (
        <div
          key={index}
          className="w-full transition duration-150 border border-solid rounded border-border-primary bg-background-secondary hover:bg-color-secondary"
        >
          <Link
            href={`/orders/${order.id}?items=${order.order_products.length}`}
            className="flex flex-col justify-between h-full gap-2 px-4 py-5"
          >
            <h4 className="font-semibold">{`${format(
              order.delivery_date,
              "dd LLL yyyy"
            )} | ${(
              order.order_products.reduce(
                (total, product) => total + product.quantity,
                0
              ) / 100
            ).toFixed(2)}€ | Items: ${order.order_products.reduce(
              (total, product) => total + product.quantity,
              0
            )} `}</h4>
            <p className="text-sm">Order number: {order.order_number}</p>
          </Link>
        </div>
      ))}
    </div>
  );
};

export default UserOrders;
