import { Products } from "@/components/products/Products";
import { format } from "date-fns";
import { getOrder } from "../action";
import { Suspense } from "react";
import ProductSkeleton from "@/components/skeletons/ProductSkeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { EnrichedProducts } from "@/types/types";

export async function generateMetadata() {
  return {
    title: `Order Details | Ecommerce Template`,
  };
}

const OrderDetails = async ({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { items: number };
}) => {
  const items = searchParams.items;

  return (
    <Suspense fallback={<AllOrderSkeleton items={items} />}>
      <OrderProducts id={params.id} />
    </Suspense>
  );
};

const OrderProducts = async ({ id }: { id: string }) => {
  const order = await getOrder(id);

  const detailsH3Styles = "text-lg font-bold mb-5";
  const bxInfoStyles = "w-full flex justify-between mt-3.5 text-sm text-999";
  const detailsLiStyles = "mt-2.5	text-sm	text-999";

  if (order) {
    const totalProducts = order.products.reduce(
      (total: number, product: any) => total + product.quantity,
      0
    );
    const allProducts: EnrichedProducts[] = order.products.filter(
      Boolean
    ) as EnrichedProducts[];
    const productsText = totalProducts === 1 ? "item" : "items";

    return (
      <div className="flex flex-col-reverse flex-wrap justify-between pt-12 sm:flex-row gap-11 sm:gap-8">
        <div className="grow-999 basis-0">
          <Products products={allProducts} extraClassname={"cart-ord-mobile"} />
        </div>

        <div className="h-full grow sm:basis-800 sm:sticky top-8">
          <div className="mb-10">
            <h3 className={detailsH3Styles}>Order Details</h3>
            <div className={bxInfoStyles}>
              <span>Order Number</span> <span>{order?.orderNumber}</span>
            </div>
            <div className={bxInfoStyles}>
              <span>Order Date</span>{" "}
              <span>{format(order.purchaseDate, "dd LLL yyyy")}</span>
            </div>
            <div className={bxInfoStyles}>
              <span>Expected Delivery Date</span>{" "}
              <span>{format(order.expectedDeliveryDate, "dd LLL yyyy")}</span>
            </div>
          </div>
          <div className="pt-10 mb-10 border-t border-solid border-border-primary">
            <h3 className={detailsH3Styles}>Delivery Address</h3>
            <ul>
              <li className={detailsLiStyles}>{order.name}</li>
              <li className={detailsLiStyles}>{order.address.line1}</li>
              {order.address.line2 && (
                <li className={detailsLiStyles}>{order.address.line2}</li>
              )}
              <li className={detailsLiStyles}>
                {order.address.postal_code} {order.address.city}
              </li>
              {order.phone && (
                <li className={detailsLiStyles}>+{order.phone}</li>
              )}
              <li className={detailsLiStyles}>{order.email}</li>
            </ul>
          </div>
          <div className="pt-10 border-t border-solid border-border-primary">
            <h3 className={detailsH3Styles}>Totals</h3>
            <div className={bxInfoStyles}>
              <span>
                {totalProducts} {productsText}
              </span>{" "}
              <span>{(order.total_price / 100).toFixed(2)} €</span>
            </div>
            <div className={bxInfoStyles}>
              <span>Delivery</span> <span>FREE</span>
            </div>
            <div className={bxInfoStyles}>
              <span>Total Discount</span> <span>0 €</span>
            </div>
            <div className={bxInfoStyles}>
              <span>Total</span>{" "}
              <span>{(order.total_price / 100).toFixed(2)} €</span>
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
        <ProductSkeleton
          extraClassname={"cart-ord-mobile"}
          numberProducts={items}
        />
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
