import { format } from "date-fns";
import { getOrder } from "../action";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { EnrichedProduct, OrderProduct } from "@/schemas/ecommerce";
import { GridProducts } from "@/components/products/GridProducts";
import { ProductItem } from "@/components/products/item";

export async function generateMetadata() {
  return {
    title: `Order Details | Ecommerce Template`,
  };
}

type Props = {
  params: { id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

const OrderDetails = async ({ params }: Props) => {
  return (
    <Suspense fallback={<AllOrderSkeleton items={6} />}>
      <OrderProducts id={params.id} />
    </Suspense>
  );
};

const OrderProducts = async ({ id }: { id: string }) => {
  const order = await getOrder(Number(id));

  const detailsH3Styles = "text-lg font-bold mb-5";
  const bxInfoStyles = "w-full flex justify-between mt-3.5 text-sm text-999";
  const detailsLiStyles = "mt-2.5	text-sm	text-999";

  if (order) {
    const totalProducts = order.order_products.reduce(
      (total: number, product: OrderProduct) => total + product.quantity,
      0
    );
    const allProducts = order.order_products.map((product) => {
      const variant = product.products_variants as any;
      return {
        ...variant,
        quantity: product.quantity,
        size: product.size,
      };
    }) as EnrichedProduct[];
    const productsText = totalProducts === 1 ? "item" : "items";

    return (
      <div className="flex flex-col-reverse flex-wrap justify-between pt-12 sm:flex-row gap-11 sm:gap-8">
        <div className="grow-999 basis-0">
          <GridProducts className="cart-ord-mobile">
            {allProducts.map((product) => (
              <ProductItem key={product.id} product={product} />
            ))}
          </GridProducts>
        </div>

        <div className="h-full grow sm:basis-800 sm:sticky top-8">
          <div className="mb-10">
            <h3 className={detailsH3Styles}>Order Details</h3>
            <div className={bxInfoStyles}>
              <span>Order Number</span> <span>{order.order_number}</span>
            </div>
            <div className={bxInfoStyles}>
              <span>Order Date</span>{" "}
              <span>{format(new Date(order.created_at), "dd LLL yyyy")}</span>
            </div>
            <div className={bxInfoStyles}>
              <span>Expected Delivery Date</span>{" "}
              <span>
                {format(new Date(order.delivery_date), "dd LLL yyyy")}
              </span>
            </div>
          </div>
          <div className="pt-10 mb-10 border-t border-solid border-border-primary">
            <h3 className={detailsH3Styles}>Delivery Address</h3>
            <ul>
              <li className={detailsLiStyles}>{order.customer_info?.name}</li>
              <li className={detailsLiStyles}>
                {order.customer_info?.address?.line1}
              </li>
              {order.customer_info?.address?.line2 && (
                <li className={detailsLiStyles}>
                  {order.customer_info.address.line2}
                </li>
              )}
              <li className={detailsLiStyles}>
                {order.customer_info?.address?.postal_code}{" "}
                {order.customer_info?.address?.city}
              </li>
              {order.customer_info?.phone && (
                <li className={detailsLiStyles}>
                  +{order.customer_info.phone}
                </li>
              )}
              <li className={detailsLiStyles}>{order.customer_info?.email}</li>
            </ul>
          </div>
          <div className="pt-10 border-t border-solid border-border-primary">
            <h3 className={detailsH3Styles}>Totals</h3>
            <div className={bxInfoStyles}>
              <span>
                {totalProducts} {productsText}
              </span>{" "}
              <span>
                {(order.customer_info?.total_price / 100).toFixed(2)} €
              </span>
            </div>
            <div className={bxInfoStyles}>
              <span>Delivery</span> <span>FREE</span>
            </div>
            <div className={bxInfoStyles}>
              <span>Total Discount</span> <span>0 €</span>
            </div>
            <div className={bxInfoStyles}>
              <span>Total</span>{" "}
              <span>
                {(order.customer_info?.total_price / 100).toFixed(2)} €
              </span>
            </div>
            <div className={bxInfoStyles}>(VAT included)</div>
          </div>
        </div>
      </div>
    );
  } else {
    return <p>Order not found.</p>;
  }
};

const AllOrderSkeleton = ({ items }: { items: number }) => {
  const detailsH3Styles = "text-lg font-bold mb-5";
  const bxInfoStyles = "w-full flex justify-between mt-3.5 text-sm text-999";
  const detailsLiStyles = "mt-2.5	text-sm	text-999";

  return (
    <div className="flex flex-col-reverse flex-wrap justify-between pt-12 sm:flex-row gap-11 sm:gap-8">
      <div className="grow-999 basis-0">
        <GridProducts className="cart-ord-mobile">
          {Array.from({ length: items }).map((_, index) => (
            <Skeleton key={index} className="h-[300px] w-full" />
          ))}
        </GridProducts>
      </div>

      <div className="h-full grow sm:basis-800 sm:sticky top-8">
        <div className="mb-10">
          <h3 className={detailsH3Styles}>Order Details</h3>
          <div className={bxInfoStyles}>
            <span>Order Number</span>{" "}
            <span>
              <Skeleton className="h-5 w-[120px]" />
            </span>
          </div>
          <div className={bxInfoStyles}>
            <span>Order Date</span>{" "}
            <span>
              <Skeleton className="h-5 w-[100px]" />
            </span>
          </div>
          <div className={bxInfoStyles}>
            <span>Expected Delivery Date</span>{" "}
            <span>
              <Skeleton className="h-5 w-[100px]" />
            </span>
          </div>
        </div>
        <div className="pt-10 mb-10 border-t border-solid border-border-primary">
          <h3 className={detailsH3Styles}>Delivery Address</h3>
          <ul>
            <li className={detailsLiStyles}>
              <Skeleton className="h-5 w-[120px]" />
            </li>
            <li className={detailsLiStyles}>
              <Skeleton className="h-5 w-[130px]" />
            </li>
            <li className={detailsLiStyles}>
              <Skeleton className="h-5 w-[140px]" />
            </li>
            <li className={detailsLiStyles}>
              <Skeleton className="h-5 w-[110px]" />
            </li>
            <li className={detailsLiStyles}>
              <Skeleton className="h-5 w-[150px]" />
            </li>
          </ul>
        </div>
        <div className="pt-10 border-t border-solid border-border-primary">
          <h3 className={detailsH3Styles}>Totals</h3>
          <div className={bxInfoStyles}>
            <span>
              <Skeleton className="h-5 w-[50px]" />
            </span>{" "}
            <span>
              <Skeleton className="h-5 w-[80px]" />
            </span>
          </div>
          <div className={bxInfoStyles}>
            <span>Delivery</span> <span>FREE</span>
          </div>
          <div className={bxInfoStyles}>
            <span>Total Discount</span> <span>0 €</span>
          </div>
          <div className={bxInfoStyles}>
            <span>Total</span>{" "}
            <span>
              <Skeleton className="h-5 w-[80px]" />
            </span>
          </div>
          <div className={bxInfoStyles}>(VAT included)</div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
