import { getUserOrders } from "./action";
import { getUser } from "@/lib/auth/server";
import Link from "next/link";
import { Suspense } from "react";
import { SVGLoadingIcon } from "@/components/ui/loader";
import { OrderCard } from "@/components/orders";
import { HiOutlineCube } from "react-icons/hi";

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
        className="flex font-medium	 items-center bg-[#0C0C0C] justify-center text-sm min-w-[160px] max-w-[160px] h-[40px] px-[10px] rounded-md border border-solid border-[#2E2E2E] transition-all hover:bg-background-tertiary hover:border-[#454545]"
        href="/login"
      >
        Login
      </Link>
    </div>
  );
};

const Orders = async () => {
  const orders = await getUserOrders();

  if (!orders) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-[80vh] gap-4 px-4">
        <div className="p-6 rounded-full bg-red-500/10">
          <HiOutlineCube className="w-16 h-16 text-red-500" />
        </div>
        <h2 className="text-3xl font-bold">Error Loading Orders</h2>
        <p className="text-center text-muted-foreground max-w-md">
          There was a problem loading your orders. Please make sure the database
          tables are created.
        </p>
        <div className="flex gap-4">
          <Link
            className="flex font-medium items-center bg-background-secondary justify-center text-sm min-w-[160px] h-[40px] px-6 rounded-lg transition-all hover:bg-background-tertiary"
            href="/"
          >
            Go Home
          </Link>
          <Link
            className="flex font-medium items-center bg-color-secondary justify-center text-sm min-w-[160px] h-[40px] px-6 rounded-lg transition-all hover:bg-border-secondary text-background-primary"
            href="/orders"
          >
            Retry
          </Link>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-[80vh] gap-4 px-4">
        <div className="p-6 rounded-full bg-background-secondary">
          <HiOutlineCube className="w-16 h-16 text-muted-foreground" />
        </div>
        <h2 className="text-3xl font-bold">No Orders Yet</h2>
        <p className="text-center text-muted-foreground max-w-md">
          Start shopping and your orders will appear here. We'll keep track of
          everything for you!
        </p>
        <Link
          className="flex font-medium items-center bg-color-secondary justify-center text-sm min-w-[160px] h-[40px] px-6 rounded-lg transition-all hover:bg-border-secondary text-background-primary"
          href="/"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-12 pb-20">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-muted-foreground">
          View and track all your orders in one place
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    </div>
  );
};

export default UserOrders;
