/** COMPONENTS */
import { ProductImage } from "../products/ProductImage";
import Link from "next/link";
import { DeleteButton } from "./DeleteButton";
import { ProductCartInfo } from "./ProductCartInfo";
/** TYPES */
import type {
  CartItem,
  ProductVariant,
  ProductWithVariants,
} from "@/lib/db/drizzle/schema";

interface CartProductProps {
  product: ProductWithVariants;
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
    <div className="flex flex-col justify-between border border-solid border-border-primary rounded-md overflow-hidden">
      <Link href={productLink} className="hover:scale-105 transition-all">
        <ProductImage
          image={variant.images[0]}
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

          <DeleteButton cartItemId={cartItemId} />
        </div>
        <div className="text-sm">{price.toFixed(2)} €</div>
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
