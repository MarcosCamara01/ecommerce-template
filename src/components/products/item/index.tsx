import { EnrichedProduct } from "@/schemas/ecommerce";
import { ProductImage } from "./Image";
import Link from "next/link";
import { cn } from "@/libs/utils";
import DeleteButton from "@/components/cart/DeleteButton";
import WishlistButton from "@/components/cart/WishlistButton";
import ProductCartInfo from "@/components/cart/ProductCartInfo";

interface ProductItemProps {
  product: EnrichedProduct;
}

export const ProductItem = ({ product }: ProductItemProps) => {
  const productLink = `/${product.category}/${product.id}`;

  const { cart_item, wishlist_item, name, id, img, price } = product;

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
          {cart_item ? (
            <DeleteButton cartItemId={cart_item.id} />
          ) : (
            <WishlistButton productId={id} isFavorite={!!wishlist_item} />
          )}
        </div>
        {/* <div className="text-sm">{price.toFixed(2)} €</div> */}
        {cart_item && <ProductCartInfo product={product} />}
      </div>
    </div>
  );
};
