import Link from "next/link";
import { ProductImage } from "./item/Image";
import dynamic from "next/dynamic";
import { Skeleton } from "../ui/skeleton";
import { getTotalWishlist } from "@/app/(carts)/wishlist/action";
import { cn } from "@/libs/utils";
import { getUser } from "@/libs/supabase/auth/getUser";
import type { EnrichedProduct } from "@/schemas/ecommerce";

const WishlistButton = dynamic(() => import("../cart/WishlistButton"), {
  loading: () => <Skeleton className="w-5 h-5" />,
});

const DeleteButton = dynamic(() => import("../cart/DeleteButton"), {
  loading: () => <Skeleton className="w-5 h-5" />,
});

const ProductCartInfo = dynamic(() => import("../cart/ProductCartInfo"), {
  loading: () => <Skeleton className="w-24 h-8" />,
});

export const Products = async ({
  products,
  extraClassname = "",
}: {
  products: EnrichedProduct[];
  extraClassname: string;
}) => {
  return (
    <div
      className={cn(
        "grid gap-x-3.5 gap-y-6 sm:gap-y-9",
        "sm:grid-cols-auto-fill-250",
        {
          "grid-cols-auto-fill-110": extraClassname === "colums-mobile",
          "grid-cols-1": extraClassname === "cart-ord-mobile",
        }
      )}
    >
      {products.map((product, index) => {
        const productLink = `/${product.category}/${product.id}`;

        return (
          <div
            className={cn(
              "flex justify-between border border-solid border-border-primary rounded-md overflow-hidden",
              extraClassname === "cart-ord-mobile"
                ? "flex-row sm:flex-col"
                : "flex-col"
            )}
            key={index}
          >
            <Link
              href={productLink}
              className={cn(
                extraClassname === "cart-ord-mobile"
                  ? "w-6/12 sm:w-full hover:scale-105 transition-all"
                  : "hover:scale-105 transition-all"
              )}
            >
              <ProductImage
                image={product.img}
                name={product.name}
                width={280}
                height={425}
                priority={index === 0}
                sizes="(max-width: 640px) 100vw, (max-width: 1154px) 33vw, (max-width: 1536px) 25vw, 20vw"
              />
            </Link>
            <div
              className={cn(
                "flex justify-between flex-col gap-2.5 p-3.5 bg-background-secondary z-10",
                {
                  "w-6/12 sm:w-full": extraClassname === "cart-ord-mobile",
                }
              )}
            >
              <div className="flex justify-between w-full">
                <Link href={productLink} className="w-10/12">
                  <h2 className="text-sm font-semibold truncate">
                    {product.name}
                  </h2>
                </Link>
                {quantity ? (
                  purchased ? (
                    quantity > 1 && <span className="text-sm">{quantity}</span>
                  ) : (
                    <DeleteButton product={product} />
                  )
                ) : (
                  // <WishlistButton
                  //   productId={JSON.stringify(_id)}
                  //   wishlistString={JSON.stringify(wishlist)}
                  // />
                  <></>
                )}
              </div>
              {!purchased && (
                <div className="text-sm">
                  {quantity ? (price * quantity).toFixed(2) : price} €
                </div>
              )}
              {quantity !== undefined && <ProductCartInfo product={product} />}
            </div>
          </div>
        );
      })}
    </div>
  );
};
