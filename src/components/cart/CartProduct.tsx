import { displayName } from "@/utils/product-name";
import Image from "next/image";
import Link from "next/link";

import { swatchBackground } from "@/constants/colors";
import type {
  CartItem,
  Product,
  ProductVariant,
} from "@/lib/db/drizzle/schema";
import { formatPriceFromEuros } from "@/utils/formatters";

import { DeleteButton } from "./DeleteButton";
import { ProductCartInfo } from "./ProductCartInfo";

interface CartProductProps {
  product: Product;
  cartItemId: CartItem["id"];
  size: CartItem["size"];
  quantity: CartItem["quantity"];
  variant: ProductVariant;
}

/** One bag line: photo, name, colour and size, stepper, remove, line total. */
export const CartProduct = ({
  product,
  cartItemId,
  size,
  quantity,
  variant,
}: CartProductProps) => {
  const { name, price, category, id } = product;
  const productLink = `/${category}/${id}?variant=${encodeURIComponent(variant.color)}`;
  // The same piece can be in the bag in two sizes: the controls say which.
  const lineName = `${displayName(name)}, ${variant.color}, size ${size}`;

  return (
    <article className="grid grid-cols-[80px_minmax(0,1fr)_auto] items-center gap-3 border-b border-line py-3 lg:grid-cols-[150px_minmax(0,1fr)_auto] lg:items-stretch lg:gap-6 lg:py-5">
      <Link
        href={productLink}
        tabIndex={-1}
        aria-hidden="true"
        className="block overflow-hidden rounded-field bg-photo lg:rounded-toast"
      >
        <Image
          src={variant.images[0] ?? product.img}
          alt=""
          width={150}
          height={196}
          sizes="(max-width: 1023px) 80px, 150px"
          className="h-[104px] w-20 object-cover lg:h-[196px] lg:w-[150px]"
        />
      </Link>
      <div className="flex min-w-0 flex-col gap-2 lg:justify-between lg:gap-4">
        <div className="flex flex-col gap-0.5 lg:gap-1.5">
          <Link
            href={productLink}
            className="font-medium leading-tight lg:font-display-75 lg:text-[30px] lg:leading-none lg:[word-spacing:0.1em]"
          >
            {displayName(name)}
          </Link>
          <span className="flex items-center gap-2 text-xs text-muted lg:text-sm">
            <span
              aria-hidden="true"
              className="hidden size-3.5 rounded-pill shadow-[0_0_0_1px_var(--line)] lg:inline-block"
              style={{ background: swatchBackground(variant.color) }}
            />
            {variant.color} · <span className="max-lg:hidden">Size</span> {size}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="lg:hidden">
            <ProductCartInfo
              cartItemId={cartItemId}
              quantity={quantity}
              productName={lineName}
              compact
            />
          </span>
          <span className="max-lg:hidden">
            <ProductCartInfo cartItemId={cartItemId} quantity={quantity} productName={lineName} />
          </span>
          <span className="max-lg:hidden">
            <DeleteButton cartItemId={cartItemId} productName={lineName} />
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1 self-start pt-0.5 lg:gap-2">
        <span className="whitespace-nowrap tabular-nums lg:text-xl lg:font-medium">
          {formatPriceFromEuros(price * quantity)}
        </span>
        <span className="lg:hidden">
          <DeleteButton cartItemId={cartItemId} productName={lineName} />
        </span>
      </div>
    </article>
  );
};
