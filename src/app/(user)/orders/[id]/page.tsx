import { getOrder } from "../action";
import type {
  ProductWithVariants,
  OrderProductWithDetails,
} from "@/lib/db/drizzle/schema";
import {
  OrderProduct,
  OrderSummary,
  OrderSummarySkeleton,
} from "@/components/orders";
import { buttonClass } from "@/components/ui/button-classes";
import Link from "@/components/ui/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { orderStatusPresentation } from "@/lib/orders/status";
import { cn } from "@/lib/utils";
import { parsePositiveIntegerId } from "@/lib/routing/positive-integer-id";

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
    <section data-account-page="" className="flex flex-col gap-3.5 pb-24 pt-2 lg:pt-6">
      <Link
        href="/orders"
        className="flex h-10 items-center gap-2 self-start text-sm"
      >
        <svg
          aria-hidden="true"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        >
          <path d="M19 12H5M11 6l-6 6 6 6" />
        </svg>
        All orders
      </Link>
      <h1 className="sr-only">Order details</h1>
      <Suspense fallback={<OrderDetailsSkeleton items={3} />}>
        <DynamicOrderContent params={params} />
      </Suspense>
    </section>
  );
};

const OrderProducts = async ({ id }: { id: string }) => {
  const orderId = parsePositiveIntegerId(id);
  const order = orderId === null ? null : await getOrder(orderId);

  if (!order) {
    return (
      <div className="flex min-h-[50vh] flex-col items-start justify-center gap-4">
        <h2 className="font-display text-[56px] leading-[0.85] lg:text-[min(120px,8.3vw)]">
          Order not found
        </h2>
        <p className="max-w-[520px] text-muted">
          The order you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to
          it.
        </p>
        <Link href="/orders" className={buttonClass()}>
          Back to orders
        </Link>
      </div>
    );
  }

  const allProducts = order.orderProducts.map(
    (orderProduct: OrderProductWithDetails, index: number) => {
      const variant = orderProduct.variant;
      const product = variant.product;

      const productWithVariants: ProductWithVariants = {
        ...product,
        // Show the bought variant image (like in the cart)
        img: variant.images[0] ?? product.img,
        variants: [
          {
            id: variant.id,
            stripeId: variant.stripeId,
            productId: variant.productId,
            color: variant.color,
            sizes: variant.sizes,
            images: variant.images,
            archivedAt: variant.archivedAt,
            createdAt: variant.createdAt,
            updatedAt: variant.updatedAt,
          },
        ],
      };

      return {
        orderProductId: orderProduct.id,
        product: productWithVariants,
        size: orderProduct.size,
        quantity: orderProduct.quantity,
        unitAmount: orderProduct.unitAmount,
        currency: orderProduct.currency,
        productName: orderProduct.productName,
        variantColor: orderProduct.variantColor,
        imageUrl: orderProduct.imageUrl,
        priority: index === 0,
      };
    },
  );

  const status = orderStatusPresentation(order.status);
  const itemCount = allProducts.reduce((total, line) => total + line.quantity, 0);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="font-display text-[76px] leading-[0.8] lg:text-[min(200px,14vw)]">
          Order #{order.orderNumber}
        </p>
        <span
          className={cn(
            "flex h-9 items-center rounded-pill px-4 text-sm font-semibold",
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>
      <div className="grid items-start gap-5 pt-4 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-12">
        <div className="lg:order-2 lg:sticky lg:top-[100px]">
          <OrderSummary order={order} />
        </div>
        <div className="flex flex-col lg:order-1">
          <h2 className="mb-1.5 text-lg font-semibold">Items · {itemCount}</h2>
          {allProducts.map(({ orderProductId, product, size, quantity, unitAmount, currency, productName, variantColor, imageUrl, priority }) => (
            <OrderProduct
              key={orderProductId}
              product={product}
              size={size}
              quantity={quantity}
              unitAmount={unitAmount}
              currency={currency}
              productName={productName}
              variantColor={variantColor}
              imageUrl={imageUrl}
              priority={priority}
            />
          ))}
        </div>
      </div>
    </>
  );
};

const OrderDetailsSkeleton = ({ items }: { items: number }) => {
  return (
    <div aria-busy="true" aria-label="Loading order" className="flex flex-col gap-5">
      <Skeleton className="h-[min(160px,12vw)] min-h-16 w-2/3 rounded-photo" />
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-12">
        <div className="lg:order-2">
          <OrderSummarySkeleton />
        </div>
        <div className="flex flex-col lg:order-1">
          {Array.from({ length: items }).map((_, index) => (
            <div key={index} className="grid grid-cols-[96px_1fr] gap-[18px] border-b border-line py-4 lg:grid-cols-[140px_1fr]">
              <Skeleton className="aspect-[3/4] rounded-chip" />
              <Skeleton className="h-5 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
