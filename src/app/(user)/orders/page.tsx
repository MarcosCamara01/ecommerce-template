import { getUserOrders } from "./action";
import { getAllProducts } from "@/app/actions";
import { getPrincipal } from "@/lib/identity";
import Link from "next/link";
import { Suspense } from "react";
import { AccountGreeting, AccountNav } from "@/components/account/AccountNav";
import { OrderCard } from "@/components/orders";
import { RailCard } from "@/components/products/RailCard";
import { buttonClass } from "@/components/ui/button-classes";
import { Skeleton } from "@/components/ui/skeleton";

export async function generateMetadata() {
  return {
    title: `Orders | Ecommerce Template`,
  };
}

/**
 * Orders page with PPR: static shell + dynamic user content
 * The user check and orders content stream in via Suspense
 */
const UserOrders = () => {
  return (
    <section data-account-page="" className="flex flex-col gap-5 pb-24">
      <div className="flex flex-col gap-5 pt-3 lg:pt-12">
        <AccountGreeting />
        <h1 className="font-display text-[min(112px,29vw)] leading-[0.8] lg:text-[min(240px,16vw)]">
          Orders
        </h1>
      </div>
      <Suspense
        fallback={
          <div aria-busy="true" aria-label="Loading orders" className="flex flex-col gap-3.5 pt-4">
            {[0, 1].map((key) => (
              <Skeleton key={key} className="h-[140px] rounded-photo-lg" />
            ))}
          </div>
        }
      >
        <OrdersContent />
      </Suspense>
    </section>
  );
};

function OrdersMessage({
  title,
  body,
  actions,
  starters = false,
}: {
  title: string;
  body: string;
  actions: React.ReactNode;
  starters?: boolean;
}) {
  return (
    <div className="flex flex-col items-start gap-5 pt-7">
      <div className="flex max-w-[760px] flex-col gap-4">
        <h2 className="font-display text-[56px] leading-[0.85] lg:text-[min(112px,7.8vw)]">
          {title}
        </h2>
        <p className="max-w-[520px] text-base lg:text-lg">{body}</p>
      </div>
      <div className="flex flex-wrap gap-2">{actions}</div>
      {starters ? (
        <Suspense fallback={null}>
          <Starters />
        </Suspense>
      ) : null}
    </div>
  );
}

async function Starters() {
  const starters = [...(await getAllProducts())]
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
    .slice(0, 4);
  if (starters.length === 0) return null;
  return (
    <div className="flex w-full flex-col gap-4 pt-7">
      <h3 className="text-13 font-semibold uppercase tracking-[0.08em]">Start with these</h3>
      <div className="grid grid-cols-2 gap-x-3 gap-y-6 lg:grid-cols-4">
        {starters.map((product) => (
          <RailCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

/**
 * Dynamic component that checks user and renders orders
 * This streams at request time (uses headers() via getUser)
 */
const OrdersContent = async () => {
  const user = await getPrincipal();

  if (!user) {
    return (
      <OrdersMessage
        title="No orders yet"
        body="To view your orders you must be logged in."
        actions={
          <>
            <Link href="/login" className={buttonClass()}>
              Sign in
            </Link>
            <Link href="/register" className={buttonClass({ variant: "secondary" })}>
              Create account
            </Link>
          </>
        }
      />
    );
  }

  return (
    <>
      <AccountNav current="orders" />
      <Orders />
    </>
  );
};

const Orders = async () => {
  const orders = await getUserOrders();

  if (!orders) {
    return (
      <OrdersMessage
        title="Error loading orders"
        body="There was a problem loading your orders. Please make sure the database tables are created."
        actions={
          <>
            <Link href="/orders" className={buttonClass()}>
              Retry
            </Link>
            <Link href="/" className={buttonClass({ variant: "secondary" })}>
              Go home
            </Link>
          </>
        }
      />
    );
  }

  if (orders.length === 0) {
    return (
      <OrdersMessage
        title="No orders yet"
        body="Start shopping and your orders will appear here. We'll keep track of everything for you!"
        actions={
          <Link href="/new-in" className={buttonClass()}>
            Start shopping
          </Link>
        }
        starters
      />
    );
  }

  return (
    <div className="flex flex-col gap-3.5 pt-2">
      <h2 className="sr-only">Your orders</h2>
      {orders.map((order) => (
        <OrderCard key={order.id} order={order} />
      ))}
    </div>
  );
};

export default UserOrders;
