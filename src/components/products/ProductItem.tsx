/** COMPONENTS */
import { ProductImage } from "./ProductImage";
import Link from "next/link";
/** FUNCTIONALITY */
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
/** TYPES */
import type { ProductWithVariants } from "@/lib/db/drizzle/schema";

const WishlistButton = dynamic(() => import("../wishlist/WishlistButton"));

interface ProductItemProps {
  product: ProductWithVariants;
}

export const ProductItem = ({ product }: ProductItemProps) => {
  const { name, id, img, price, category, variants } = product;

  const productLink = `/${category}/${id}?variant=${variants[0].color}`;

  return (
    <div className="flex flex-col justify-between border border-solid border-border-primary rounded-md overflow-hidden">
      <Link href={productLink} className={cn("hover:scale-105 transition-all")}>
        <ProductImage
          image={img}
          name={name}
          width={280}
          height={425}
          sizes="(max-width: 640px) 100vw, (max-width: 1154px) 33vw, (max-width: 1536px) 25vw, 20vw"
        />
      </Link>
      <div className="flex justify-between flex-col gap-2.5 p-3.5 bg-background-secondary z-10">
        <div className="flex justify-between w-full">
          <Link href={productLink} className="w-10/12">
            <h2 className="text-sm font-semibold truncate">{name}</h2>
          </Link>

          <WishlistButton productId={id} />
        </div>
        <div className="text-sm">{price.toFixed(2)} €</div>
      </div>
    </div>
  );
};
