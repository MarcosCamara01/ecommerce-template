import Link from "next/link";

import type {
  CartItem,
  Product,
  ProductVariant,
} from "@/lib/db/drizzle/schema";

import { ProductImage } from "../products/ProductImage";
import { DeleteButton } from "./DeleteButton";
import { ProductCartInfo } from "./ProductCartInfo";

interface CartProductProps {
  product: Product;
  cartItemId: CartItem["id"];
  size: CartItem["size"];
  quantity: CartItem["quantity"];
  variant: ProductVariant;
}

export const CartProduct = ({
  product,
  cartItemId,
  size,
  quantity,
  variant,
}: CartProductProps) => {
  const { name, price, category, id } = product;

  const productLink = `/${category}/${id}?variant=${variant.color}`;

  return (
    <div className="flex flex-col justify-between overflow-hidden rounded-md border border-solid border-border-primary">
      <Link href={productLink} className="transition-all hover:scale-105">
        <ProductImage
          image={variant.images[0]}
          name={name}
          width={280}
          height={425}
          sizes="(max-width: 640px) 100vw, (max-width: 1154px) 33vw, (max-width: 1536px) 25vw, 20vw"
        />
      </Link>
      <div className="z-10 flex flex-col justify-between gap-2.5 bg-background-secondary p-3.5">
        <div className="flex w-full justify-between">
          <Link href={productLink} className="w-10/12">
            <h2 className="truncate text-sm font-semibold">{name}</h2>
          </Link>

          <DeleteButton cartItemId={cartItemId} />
        </div>
        <div className="text-sm">{price.toFixed(2)} EUR</div>
        <ProductCartInfo
          cartItemId={cartItemId}
          size={size}
          quantity={quantity}
          color={variant.color}
        />
      </div>
    </div>
  );
};
