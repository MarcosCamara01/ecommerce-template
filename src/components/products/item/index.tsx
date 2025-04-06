import { cn } from "@/libs/utils";
import type { EnrichedProduct } from "@/schemas/ecommerce";
import Link from "next/link";
import { ProductImage } from "./Image";

export const ProductItem = ({ product }: { product: EnrichedProduct }) => {
  const productLink = `/${product.category}/${product.id}`;

  return (
    <div className="flex flex-col justify-between border border-solid border-border-primary rounded-md overflow-hidden">
      <Link href={productLink} className={cn("hover:scale-105 transition-all")}>
        <ProductImage
          image={product.img}
          name={product.name}
          width={280}
          height={425}
          sizes="(max-width: 640px) 100vw, (max-width: 1154px) 33vw, (max-width: 1536px) 25vw, 20vw"
        />
      </Link>
      <div className="flex justify-between flex-col gap-2.5 p-3.5 bg-background-secondary z-10">
        <div className="flex justify-between w-full">
          <Link href={productLink} className="w-10/12">
            <h2 className="text-sm font-semibold truncate">{product.name}</h2>
          </Link>
          {/* {quantity ? (
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
          )} */}
        </div>
        {/* {!purchased && (
          <div className="text-sm">
            {quantity ? (price * quantity).toFixed(2) : price} €
          </div>
        )}
        {quantity !== undefined && <ProductCartInfo product={product} />} */}
      </div>
    </div>
  );
};
