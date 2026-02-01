import { getOrder } from "../action";
import type {
  ProductWithVariants,
  OrderProductWithDetails,
} from "@/lib/db/drizzle/schema";
import { GridProducts, ProductItem } from "@/components/products";
import { OrderSummary, OrderSummarySkeleton } from "@/components/orders";
import { HiArrowLeft } from "react-icons/hi";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export async function generateMetadata() {
  return {
    title: `Order Details | Ecommerce Template`,
  };
}

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

async function DynamicOrderContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderProducts id={id} />;
}

const OrderDetails = async ({ params }: Props) => {
  return (
    <Suspense fallback={<OrderDetailsSkeleton items={6} />}>
      <DynamicOrderContent params={params} />
    </Suspense>
  );
};

const OrderProducts = async ({ id }: { id: string }) => {
  const order = await getOrder(Number(id));

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <h2 className="text-2xl font-bold">Order Not Found</h2>
        <p className="text-muted-foreground">
          The order you're looking for doesn't exist or you don't have access to
          it.
        </p>
        <Link
          href="/orders"
          className="flex items-center gap-2 px-4 py-2 transition-all rounded-lg bg-background-secondary hover:bg-background-tertiary"
        >
          <HiArrowLeft className="w-4 h-4" />
          Back to Orders
        </Link>
      </div>
    );
  }

  const allProducts: ProductWithVariants[] = order.orderProducts.map(
    (orderProduct: OrderProductWithDetails) => {
      const variant = orderProduct.variant;
      const product = variant.product;
      return {
        ...product,
        variants: [
          {
            id: variant.id,
            stripeId: variant.stripeId,
            productId: variant.productId,
            color: variant.color,
            sizes: variant.sizes,
            images: variant.images,
            createdAt: variant.createdAt,
            updatedAt: variant.updatedAt,
          },
        ],
      };
    },
  );

  return (
    <div className="pt-8 pb-20">
      {/* Main content */}
      <div className="flex flex-col-reverse gap-8 lg:flex-row">
        {/* Products */}
        <div className="flex-1">
          <h2 className="mb-6 text-2xl font-bold">Order Items</h2>
          <GridProducts className="cart-ord-mobile">
            {allProducts.map((product) => (
              <ProductItem key={product.id} product={product} />
            ))}
          </GridProducts>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:w-[400px] lg:sticky lg:top-8 h-fit">
          <OrderSummary order={order} />
        </div>
      </div>
    </div>
  );
};

const OrderDetailsSkeleton = ({ items }: { items: number }) => {
  return (
    <div className="pt-8 pb-20 w-full">
      {/* Main content */}
      <div className="flex flex-col-reverse gap-8 lg:flex-row">
        {/* Products */}
        <div className="flex-1">
          <h2 className="mb-6 text-2xl font-bold">Order Items</h2>
          <GridProducts className="cart-ord-mobile">
            {Array.from({ length: items }).map((_, index) => (
              <Skeleton key={index} className="h-[300px] w-full" />
            ))}
          </GridProducts>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:w-[400px] lg:sticky lg:top-8 h-fit">
          <OrderSummarySkeleton />
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
