import Link from "next/link";
import { Images } from "./Images";
import { EnrichedProducts } from "@/types/types";
import dynamic from 'next/dynamic';
import { Skeleton } from "../ui/skeleton";

const Wishlist = dynamic(() => import('../cart/Wishlist'), {
  ssr: true,
  loading: () => <Skeleton className="w-5 h-5" />,
});

const DeleteButton = dynamic(() => import('../cart/DeleteButton'), {
  loading: () => <Skeleton className="w-5 h-5" />,
});

const ProductCartInfo = dynamic(() => import('../cart/ProductCartInfo'), {
  loading: () => <Skeleton className="w-24 h-8" />,
});

export const Products = async (
  { products, extraClassname = "" }:
    { products: any, extraClassname: string }
) => {
  return (
    <div className={`grid gap-x-3.5 gap-y-6 sm:gap-y-9 ${extraClassname === "colums-mobile" ? "grid-cols-auto-fill-110" : ""} ${extraClassname === "cart-ord-mobile" ? "grid-cols-1" : ""} sm:grid-cols-auto-fill-250`}>
      {products.map((product: EnrichedProducts, index: number) => {
        return (
          <div className={`flex justify-between border border-solid border-border-primary rounded-md overflow-hidden ${extraClassname === "cart-ord-mobile" ? "flex-row sm:flex-col" : "flex-col"}`} key={index}>
            <Link href={`/${product.category}/${product.quantity ? product.productId : product._id}`} className={`${extraClassname === "cart-ord-mobile" ? "w-6/12 sm:w-full" : ""} hover:scale-105 transition-all`}>
              <Images
                image={product.image}
                name={product.name}
                width={280}
                height={425}
                priority={index === 0 ? true : false}
                sizes="(max-width: 640px) 100vw,
                (max-width: 1154px) 33vw,
                (max-width: 1536px) 25vw,
                20vw"
              />
            </Link>
            <div className={`${extraClassname === "cart-ord-mobile" ? "w-6/12 sm:w-full" : ""} flex justify-between flex-col gap-2.5 p-3.5 bg-background-secondary z-10`}>
              <div className="flex justify-between w-full">
                <Link href={`/${product?.category}/${product.quantity ? product.productId : product._id}`} className="w-10/12">
                  <h2 className="text-sm font-semibold truncate">
                    {product?.name}
                  </h2>
                </Link>
                {product.quantity ? (
                  product.purchased ? (
                    product.quantity > 1 &&
                    <span>{product.quantity}</span>
                  ) : (
                    <DeleteButton product={product} />
                  )
                ) : (
                  <Wishlist product={product} />
                )}
              </div>
              {!product.purchased && (
                <div className="text-sm">
                  {product?.quantity ? (product.price * product.quantity).toFixed(2) : product.price}€
                </div>
              )}
              {product.quantity !== undefined && (
                <ProductCartInfo product={product} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
